from sqlalchemy import Column, Integer, String, Text
from .database import Base
import datetime as dt

from sqlalchemy import Column, DateTime, Integer, String

from .database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    rating = Column(Integer)
    post_date = Column(DateTime, default=dt.datetime.now)


class History(Base):
    __tablename__ = 'history'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)  # Ngày giờ tạo
