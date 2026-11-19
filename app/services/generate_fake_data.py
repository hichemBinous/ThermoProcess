import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# -----------------------------
# Configuration
# -----------------------------
NB_EVENTS = 10000
NB_CASES = 2000

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "process_mining.db"

ACTIVITIES_BASE = [
    "Create Order",
    "Validate Order",
    "Prepare Shipment",
    "Ship Order",
    "Create Invoice",
    "Receive Payment"
]

RESOURCES = [
    "Sales_1",
    "Sales_2",
    "Manager_1",
    "Warehouse_1",
    "Warehouse_2",
    "Finance_1",
    "System"
]

# variantes réalistes
VARIANTS = [
    ACTIVITIES_BASE,
    ACTIVITIES_BASE[:-1],  # paiement manquant
    ACTIVITIES_BASE + ["Send Reminder", "Receive Payment"],  # relance
    ["Create Order", "Validate Order", "Create Invoice", "Receive Payment"]  # livraison externalisée
]

START_DATE = datetime(2024, 1, 1)

# -----------------------------
# Connexion DB
# -----------------------------
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    return conn


# -----------------------------
# Génération d'événements
# -----------------------------
def generate_events():

    events = []

    events_per_case = max(3, NB_EVENTS // NB_CASES)

    for case in range(NB_CASES):

        case_id = f"C{case:05d}"
        variant = random.choice(VARIANTS)

        current_time = START_DATE + timedelta(
            days=random.randint(0, 180)
        )

        amount = random.randint(100, 10000)

        for activity in variant:

            current_time += timedelta(
                minutes=random.randint(5, 720)
            )

            event = (
                case_id,
                activity,
                current_time.strftime("%Y-%m-%d %H:%M:%S"),
                random.choice(RESOURCES),
                amount
            )

            events.append(event)

            if len(events) >= NB_EVENTS:
                return events

    return events


# -----------------------------
# Insertion DB
# -----------------------------
def insert_events(events):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.executemany("""
    INSERT INTO event_log
    (case_id, activity, timestamp, resource, amount)
    VALUES (?, ?, ?, ?, ?)
    """, events)

    conn.commit()
    conn.close()


# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":

    print("Generating events...")
    events = generate_events()

    print("Inserting into database...")
    insert_events(events)

    print(f"Done: {len(events)} events inserted")