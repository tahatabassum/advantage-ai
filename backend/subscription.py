from fastapi import HTTPException
from sqlalchemy.orm import Session
import datetime
import models

TIER_LIMITS = {
    "free": {
        "analyses_per_month": 5,
        "bulk_allowed": False,
        "pdf_export": False,
        "brand_profile": False
    },
    "pro": {
        "analyses_per_month": 50,
        "bulk_allowed": True,
        "bulk_max": 5,
        "pdf_export": True,
        "brand_profile": True
    },
    "agency": {
        "analyses_per_month": -1,  # -1 for unlimited
        "bulk_allowed": True,
        "bulk_max": 20,
        "pdf_export": True,
        "brand_profile": True
    }
}

def get_tier_limits(tier: str):
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])

def check_usage_limit(user: models.User, db: Session):
    limits = get_tier_limits(user.subscription_tier)
    
    # Check for reset date
    now = datetime.datetime.utcnow()
    if user.subscription_reset_date and now >= user.subscription_reset_date:
        reset_monthly_usage(user, db)
        db.refresh(user)

    if limits["analyses_per_month"] == -1:
        return True
    
    if user.analyses_used_this_month >= limits["analyses_per_month"]:
        raise HTTPException(
            status_code=429,
            detail=f"Monthly analysis limit reached for {user.subscription_tier} tier ({limits['analyses_per_month']} analyses). Upgrade to increase your limit."
        )
    
    return True

def increment_usage(user: models.User, db: Session):
    user.analyses_used_this_month += 1
    db.commit()

def reset_monthly_usage(user: models.User, db: Session):
    user.analyses_used_this_month = 0
    # Set next reset date to 30 days from now
    user.subscription_reset_date = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    db.commit()
