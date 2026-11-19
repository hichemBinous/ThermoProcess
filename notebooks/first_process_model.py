import pandas as pd
import sqlite3

from pm4py.objects.conversion.log import converter as log_converter
from pm4py.algo.discovery.inductive import algorithm as inductive_miner
from pm4py.visualization.process_tree import visualizer as pt_visualizer

# -----------------------------
# Charger les données SQLite
# -----------------------------
conn = sqlite3.connect("data/process_mining.db")

df = pd.read_sql("SELECT * FROM event_log", conn)

# format standard process mining
df = df.rename(columns={
    "case_id": "case:concept:name",
    "activity": "concept:name",
    "timestamp": "time:timestamp"
})

df["time:timestamp"] = pd.to_datetime(df["time:timestamp"])

# -----------------------------
# Convertir en event log PM4PY
# -----------------------------
log = log_converter.apply(df)

# -----------------------------
# Découverte du modèle
# -----------------------------
process_tree = inductive_miner.apply(log)
print(df)
# -----------------------------
# Visualisation
# -----------------------------
gviz = pt_visualizer.apply(process_tree)
pt_visualizer.view(gviz)