import sqlite3

# créer (ou ouvrir) la base locale
conn = sqlite3.connect("data\process_mining.db")

# créer un curseur
cursor = conn.cursor()

# créer la table event_log
cursor.execute("""
CREATE TABLE IF NOT EXISTS event_log (
    case_id TEXT,
    activity TEXT,
    timestamp TEXT,
    resource TEXT,
    amount REAL
)
""")

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print(cursor.fetchall())

# sauvegarder
conn.commit()

# fermer la connexion


conn.close()
print("Base créée")