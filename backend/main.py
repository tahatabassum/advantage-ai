import sys
import os
from datetime import datetime, timedelta

# Add backend to path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, Dict, List
import uvicorn
from dotenv import load_dotenv
import os
import json
import asyncio

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import secrets
from subscription import check_usage_limit, increment_usage, get_tier_limits
from email_service import send_verification_email, send_password_reset_email
from sqlalchemy import func

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from analyzer import analyze_ad, rewrite_ad_text, UnauthenticatedError, QuotaExceededError
from video_analyzer import analyze_video_ad
from schemas import (
    FullAnalysisResponse, BrandProfileSchema, BrandProfileResponse, 
    RewriteRequest, RewriteResponse, UserCreate, Token, UserResponse,
    SubscriptionStatus, PasswordResetRequest, PasswordReset, EmailVerification
)
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user
from pdf_generator import generate_pdf
import database
import models
from sqlalchemy.orm import Session

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AdVantage AI — Backend API")

# Rate Limiter Setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ADMIN_SECRET = os.getenv("ADMIN_SECRET")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://ais-pre-mafm43q6zvfx4ge5sunea3-741194872062.asia-east1.run.app")
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")

# Configure CORS
origins = ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Admin Dependency ---
def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# --- Authentication Endpoints ---

@app.post("/api/v1/advantage/auth/signup", response_model=Token)
@limiter.limit("5/minute")
async def signup(request: Request, user_data: UserCreate, db: Session = Depends(database.get_db)):
    try:
        user_data.email = user_data.email.lower().strip()
        db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pwd = get_password_hash(user_data.password)
        verification_token = secrets.token_urlsafe(32)
        
        # Set initial reset date to 30 days from now
        reset_date = datetime.utcnow() + timedelta(days=30)
        
        new_user = models.User(
            email=user_data.email, 
            hashed_password=hashed_pwd,
            verification_token=verification_token,
            subscription_reset_date=reset_date
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Send verification email
        send_verification_email(new_user.email, verification_token)
        
        # Return token immediately
        access_token = create_access_token(data={"sub": new_user.email})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": new_user
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/api/v1/advantage/auth/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, user_data: UserCreate, db: Session = Depends(database.get_db)):
    try:
        user_data.email = user_data.email.lower().strip()
        user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/api/v1/advantage/auth/verify-email")
async def verify_email(data: EmailVerification, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.verification_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"status": "ok", "message": "Email verified successfully"}

@app.post("/api/v1/advantage/auth/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, data: PasswordResetRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower().strip()).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()
        send_password_reset_email(user.email, token)
    
    # Always return success to prevent user enumeration
    return {"status": "ok", "message": "If that email exists, we have sent a reset link"}

@app.post("/api/v1/advantage/auth/reset-password")
async def reset_password(data: PasswordReset, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.reset_token == data.token).first()
    if not user or not user.reset_token_expires or datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"status": "ok", "message": "Password reset successfully"}

@app.post("/api/v1/advantage/auth/resend-verification")
async def resend_verification(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.is_verified:
        return {"status": "ok", "message": "Email already verified"}
    
    token = secrets.token_urlsafe(32)
    current_user.verification_token = token
    db.commit()
    send_verification_email(current_user.email, token)
    return {"status": "ok", "message": "Verification email resent"}

@app.get("/api/v1/advantage/auth/me", response_model=UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Core API Endpoints ---
@app.get("/api/v1/advantage/health")
async def health_check():
    api_key = os.getenv("OPENROUTER_API_KEY")
    return {
        "status": "ok",
        "ai_available": bool(api_key)
    }

@app.get("/api/v1/advantage/subscription/status", response_model=SubscriptionStatus)
async def get_subscription_status(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Check for usage reset before returning status
    check_usage_limit(current_user, db)
    
    limits = get_tier_limits(current_user.subscription_tier)
    analyses_per_month = limits["analyses_per_month"]
    
    remaining = -1
    if analyses_per_month != -1:
        remaining = max(0, analyses_per_month - current_user.analyses_used_this_month)
    
    return {
        "current_tier": current_user.subscription_tier,
        "analyses_used": current_user.analyses_used_this_month,
        "analyses_remaining": remaining,
        "reset_date": current_user.subscription_reset_date
    }

@app.post("/api/v1/advantage/analyze", response_model=FullAnalysisResponse)
@limiter.limit("10/minute")
async def analyze(
    request: Request,
    image: UploadFile = File(...),
    caption: str = Form(...),
    platform: str = Form(...),
    objective: str = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Check Usage Limits
        check_usage_limit(current_user, db)
        
        image_bytes = await image.read()
        
        # Fetch brand profile for this specific user
        brand_profile = db.query(models.BrandProfile).filter(models.BrandProfile.user_id == current_user.id).first()
        
        if brand_profile:
             brand_data = {
                "brand_name": brand_profile.brand_name,
                "industry": brand_profile.industry,
                "target_audience": brand_profile.target_audience,
                "brand_voice": brand_profile.brand_voice,
                "main_competitors": brand_profile.main_competitors
            }
        else:
            brand_data = None

        analysis = analyze_ad(image_bytes, caption, platform, objective, brand_data)
        
        # Save to database with user identity
        db_history = models.AnalysisHistory(
            user_id=current_user.id,
            platform=platform,
            overall_score=analysis["scoring"]["overall_score"],
            grade=analysis["scoring"]["grade"],
            full_json=json.dumps(analysis)
        )
        db.add(db_history)
        
        # Increment usage
        increment_usage(current_user, db)
        
        db.commit()
        db.refresh(db_history)
        
        return analysis
    except UnauthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except QuotaExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Analysis error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/advantage/analyze-video")
@limiter.limit("5/minute")
async def analyze_video(
    request: Request,
    video: UploadFile = File(...),
    caption: str = Form(""),
    platform: str = Form("instagram"),
    objective: str = Form("engagement"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check subscription limit
    check_usage_limit(current_user, db)

    # Validate file is a video
    allowed_types = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm"
    ]
    if video.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload MP4, MOV, AVI, or WebM."
        )

    # Limit file size to 50MB
    video_bytes = await video.read()
    if len(video_bytes) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Video file too large. Maximum size is 50MB."
        )

    # Get brand profile if exists
    brand_profile_db = db.query(models.BrandProfile).filter(
        models.BrandProfile.user_id == current_user.id
    ).first()
    brand_profile = None
    if brand_profile_db:
        brand_profile = {
            "brand_name": brand_profile_db.brand_name,
            "industry": brand_profile_db.industry,
            "target_audience": brand_profile_db.target_audience,
            "brand_voice": brand_profile_db.brand_voice,
            "main_competitors": brand_profile_db.main_competitors,
        }

    try:
        analysis = await asyncio.to_thread(
            analyze_video_ad,
            video_bytes,
            caption,
            platform,
            objective,
            brand_profile
        )
    except UnauthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except QuotaExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Save to history
    db_history = models.AnalysisHistory(
        user_id=current_user.id,
        platform=platform,
        overall_score=analysis["scoring"]["overall_score"],
        grade=analysis["scoring"]["grade"],
        full_json=json.dumps(analysis)
    )
    db.add(db_history)
    increment_usage(current_user, db)
    db.commit()
    db.refresh(db_history)

    return analysis

@app.post("/api/v1/advantage/analyze/rewrite", response_model=RewriteResponse)
async def rewrite(
    request: RewriteRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Fetch brand profile if exists
        brand_profile = db.query(models.BrandProfile).filter(models.BrandProfile.user_id == current_user.id).first()
        brand_data = {
            "brand_name": brand_profile.brand_name,
            "industry": brand_profile.industry,
            "target_audience": brand_profile.target_audience,
            "brand_voice": brand_profile.brand_voice
        } if brand_profile else None

        rewritten = rewrite_ad_text(request.original_text, request.feedback, brand_data)
        return rewritten
    except UnauthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except QuotaExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        print(f"Rewrite endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/advantage/history")
async def get_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        history = db.query(models.AnalysisHistory)\
            .filter(models.AnalysisHistory.user_id == current_user.id)\
            .order_by(models.AnalysisHistory.created_at.desc()).all()
        return [
            {
                "id": h.id,
                "platform": h.platform,
                "overall_score": h.overall_score,
                "grade": h.grade,
                "created_at": h.created_at.isoformat(),
                "analysis": json.loads(h.full_json)
            }
            for h in history
        ]
    except Exception as e:
        print(f"History fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/advantage/brand-profile", response_model=Optional[BrandProfileResponse])
async def get_brand_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        profile = db.query(models.BrandProfile).filter(models.BrandProfile.user_id == current_user.id).first()
        return profile
    except Exception as e:
        print(f"Brand profile fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/advantage/brand-profile", response_model=BrandProfileResponse)
async def update_brand_profile(
    profile_data: BrandProfileSchema, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        profile = db.query(models.BrandProfile).filter(models.BrandProfile.user_id == current_user.id).first()
        if profile:
            profile.brand_name = profile_data.brand_name
            profile.industry = profile_data.industry
            profile.target_audience = profile_data.target_audience
            profile.brand_voice = profile_data.brand_voice
            profile.main_competitors = profile_data.main_competitors
        else:
            profile = models.BrandProfile(**profile_data.dict(), user_id=current_user.id)
            db.add(profile)
        
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        print(f"Brand profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/advantage/export-pdf")
async def export_pdf(analysis_data: Dict):
    try:
        pdf_bytes = generate_pdf(analysis_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=AdVantage_AI_Audit.pdf"
            }
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/advantage/analyze-bulk")
@limiter.limit("3/minute")
async def analyze_bulk(
    request: Request,
    images: List[UploadFile] = File(...),
    captions: str = Form(...), # JSON stringified list of captions
    platform: str = Form(...),
    objective: str = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Check Usage Limits at start
        check_usage_limit(current_user, db)
        
        caption_list = json.loads(captions)
        if len(images) != len(caption_list):
            raise HTTPException(status_code=400, detail="Number of images and captions must match.")
            
        # Fetch brand profile
        brand_profile = db.query(models.BrandProfile).filter(models.BrandProfile.user_id == current_user.id).first()
        brand_data = {
            "brand_name": brand_profile.brand_name,
            "industry": brand_profile.industry,
            "target_audience": brand_profile.target_audience,
            "brand_voice": brand_profile.brand_voice,
            "main_competitors": brand_profile.main_competitors
        } if brand_profile else None

        results = []
        for i, img_file in enumerate(images):
            # Check limit again for each in bulk if needed, 
            # though check_usage_limit at start checks if they have capacity for at least one.
            # To be strict, we check if they have enough remaining.
            limits = get_tier_limits(current_user.subscription_tier)
            if limits["analyses_per_month"] != -1 and current_user.analyses_used_this_month >= limits["analyses_per_month"]:
                break # Stop if limit reached mid-bulk
                
            img_bytes = await img_file.read()
            analysis = analyze_ad(img_bytes, caption_list[i], platform, objective, brand_data)
            
            # Save to history with user id
            db_history = models.AnalysisHistory(
                user_id=current_user.id,
                platform=platform,
                overall_score=analysis["scoring"]["overall_score"],
                grade=analysis["scoring"]["grade"],
                full_json=json.dumps(analysis)
            )
            db.add(db_history)
            
            # Increment usage
            increment_usage(current_user, db)
            
            results.append(analysis)
            
        db.commit()
        return results
    except UnauthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except QuotaExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Bulk Analysis error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/advantage/export-comparison-pdf")
async def export_comparison_pdf(analyses: List[Dict]):
    try:
        from pdf_generator import generate_comparison_pdf
        pdf_bytes = generate_comparison_pdf(analyses) 
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Comparison_Report.pdf"}
        )
    except Exception as e:
        print(f"Comparison PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Admin Endpoints ---

@app.get("/api/v1/advantage/admin/stats")
async def get_admin_stats(current_user: models.User = Depends(check_admin), db: Session = Depends(database.get_db)):
    total_users = db.query(func.count(models.User.id)).scalar()
    total_analyses = db.query(func.count(models.AnalysisHistory.id)).scalar()
    
    users_by_tier = db.query(models.User.subscription_tier, func.count(models.User.id))\
        .group_by(models.User.subscription_tier).all()
    
    last_7_days = datetime.utcnow() - timedelta(days=7)
    analyses_7d = db.query(func.count(models.AnalysisHistory.id))\
        .filter(models.AnalysisHistory.created_at >= last_7_days).scalar()
        
    last_30_days = datetime.utcnow() - timedelta(days=30)
    analyses_30d = db.query(func.count(models.AnalysisHistory.id))\
        .filter(models.AnalysisHistory.created_at >= last_30_days).scalar()
        
    top_platforms = db.query(models.AnalysisHistory.platform, func.count(models.AnalysisHistory.id))\
        .group_by(models.AnalysisHistory.platform)\
        .order_by(func.count(models.AnalysisHistory.id).desc())\
        .limit(5).all()

    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "users_by_tier": dict(users_by_tier),
        "analyses_last_7_days": analyses_7d,
        "analyses_last_30_days": analyses_30d,
        "top_platforms": dict(top_platforms)
    }

@app.get("/api/v1/advantage/admin/users")
async def get_admin_users(
    page: int = 1, 
    limit: int = 20, 
    search: Optional[str] = None,
    current_user: models.User = Depends(check_admin), 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User)
    if search:
        query = query.filter(models.User.email.ilike(f"%{search}%"))
    
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "tier": u.subscription_tier,
                "created_at": u.created_at,
                "is_verified": u.is_verified,
                "analyses_count": db.query(func.count(models.AnalysisHistory.id)).filter(models.AnalysisHistory.user_id == u.id).scalar()
            } for u in users
        ]
    }

@app.post("/api/v1/advantage/admin/users/{user_id}/change-tier")
async def admin_change_tier(
    user_id: int, 
    tier_data: Dict, 
    current_user: models.User = Depends(check_admin), 
    db: Session = Depends(database.get_db)
):
    new_tier = tier_data.get("tier")
    if new_tier not in ["free", "pro", "agency"]:
        raise HTTPException(status_code=400, detail="Invalid tier")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.subscription_tier = new_tier
    db.commit()
    return {"status": "ok", "message": f"User tier changed to {new_tier}"}

@app.post("/api/v1/advantage/debug/reset-users")
async def reset_users(
    secret: str,
    db: Session = Depends(database.get_db)
):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.query(models.AnalysisHistory).delete()
    db.query(models.BrandProfile).delete()
    db.query(models.User).delete()
    db.commit()
    return {"message": "All users and data reset successfully"}

# Mount static files AFTER all API routes
dist_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    print(f"WARNING: Static files not found at {dist_path}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)