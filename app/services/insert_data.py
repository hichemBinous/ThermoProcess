import sqlite3

conn = sqlite3.connect("process_mining.db")
cursor = conn.cursor()

data = [
("1001","Création commande","2024-01-01 09:02","Sales_1",1200),
("1001","Validation commande","2024-01-01 09:10","Manager_1",1200),
("1001","Facturation","2024-01-02 16:00","Finance_1",1200)
]

cursor.executemany("""
INSERT INTO event_log
(case_id, activity, timestamp, resource, amount)
VALUES (?, ?, ?, ?, ?)
""", data)

conn.commit()
conn.close()