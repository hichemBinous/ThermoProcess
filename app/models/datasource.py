from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import Base as Base

class DataSource(Base):
    __tablename__ = "datasources"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False, default="csv")
    original_filename = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())