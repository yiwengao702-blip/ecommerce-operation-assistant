from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    # 显式连接池参数：默认 5+10 的上限在“API 多 worker + Celery 多队列”部署下容易触发 PoolTimeout，
    # 这里按单进程 10 常驻 + 20 溢出、30 秒取连接超时配置，MySQL 默认 151 连接内可容纳多进程共存。
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """为每个请求创建数据库会话，并在请求结束时可靠关闭连接。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
