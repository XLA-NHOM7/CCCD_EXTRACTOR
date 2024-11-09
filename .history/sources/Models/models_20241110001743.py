from sqlalchemy import Column, Integer, String, Text
from .database import Base
import datetime as dt

from sqlalchemy import Column, DateTime, Integer, String

from .database import Base



class History(Base):
    __tablename__ = 'history'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)  # Ngày giờ tạo