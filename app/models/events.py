from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    datasource_id = Column(Integer, ForeignKey("datasources.id", ondelete="CASCADE"), nullable=False)
    row_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    