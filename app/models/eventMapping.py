from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from core.database import Base


class EventMapping(Base):
    __tablename__ = "event_mappings"

    id = Column(Integer, primary_key=True, index=True)
    datasource_id = Column(Integer, ForeignKey("datasources.id", ondelete="CASCADE"), unique=True, nullable=False)

    case_id_column = Column(String, nullable=False)
    activity_column = Column(String, nullable=False)
    timestamp_column = Column(String, nullable=False)
    resource_column = Column(String, nullable=True)
    context_columns = Column(JSON, nullable=False, default=list)

    is_applied = Column(Integer, nullable=False, default=0)
    last_applied_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())