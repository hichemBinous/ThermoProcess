import pandas as pd
from core.database import get_connection

conn = get_connection()

df = pd.read_sql("SELECT * FROM event_log", conn)

print(df.head())
print(len(df))