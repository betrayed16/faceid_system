from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    face_vector = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 