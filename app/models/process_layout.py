from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from core.database import Base


class ProcessLayout(Base):
    __tablename__ = "process_layouts"

    id = Column(Integer, primary_key=True, index=True)
    datasource_id = Column(Integer, ForeignKey("datasources.id", ondelete="CASCADE"), unique=True, nullable=False)

    layout_json = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())