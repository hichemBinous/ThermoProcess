import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# dossier racine du projet
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# chemin vers la base SQLite
DB_PATH = os.path.join(BASE_DIR, "data", "process_mining.db")

# raw string pour éviter problèmes de chemin
DATABASE_URL = rf"sqlite:///{DB_PATH}"

print("Using DB:", DB_PATH)

# création engine SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # nécessaire pour SQLite
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# fonction pour dépendance FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()