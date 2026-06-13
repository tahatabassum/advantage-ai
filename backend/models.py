from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Subscription and Verification fields
    subscription_tier = Column(String, default="agency")
    analyses_used_this_month = Column(Integer, default=0)
    subscription_reset_date = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    analyses = relationship("AnalysisHistory", back_populates="user")
    brand_profile = relationship("BrandProfile", back_populates="user", uselist=False)

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String)
    overall_score = Column(Integer)
    grade = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    full_json = Column(Text)

    user = relationship("User", back_populates="analyses")

class BrandProfile(Base):
    __tablename__ = "brand_profile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    brand_name = Column(String)
    industry = Column(String)
    target_audience = Column(Text)
    brand_voice = Column(String)  # Professional, Playful, Bold, etc.
    main_competitors = Column(Text)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="brand_profile")
