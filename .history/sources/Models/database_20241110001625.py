from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Kết nối cơ sở dữ liệu SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///sources/Database/database.db"
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgresserver/db"


#tạo một "engine" đóng vai trò như cổng kết nối giữa SQLAlchemy và cơ sở dữ liệu
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
