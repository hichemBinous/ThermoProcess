from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from core.database import Base

class RawEvent(Base):
    __tablename__ = "raw_events"

    id = Column(Integer, primary_key=True, index=True)
    datasource_id = Column(Integer, ForeignKey("datasources.id", ondelete="CASCADE"), nullable=False)

    case_id = Column(String, nullable=False)
    activity = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    resource = Column(String, nullable=True)

    context_data = Column(Text, nullable=True, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())