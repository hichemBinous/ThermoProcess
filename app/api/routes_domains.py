from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.domain import Domain

router = APIRouter(prefix="/domains", tags=["Domains"])


@router.post("/")
def create_domain(name: str, description: str, db: Session = Depends(get_db)):
    domain = Domain(
        name=name,
        description=description
    )
    db.add(domain)
    db.commit()
    db.refresh(domain)

    return domain


@router.get("/")
def list_domains(db: Session = Depends(get_db)):
    return db.query(Domain).all()


@router.get("/{domain_id}")
def get_domain(domain_id: int, db: Session = Depends(get_db)):
    return db.query(Domain).filter(Domain.id == domain_id).first()


@router.delete("/{domain_id}")
def delete_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    db.delete(domain)
    db.commit()
    return {"message": "Domain deleted"}