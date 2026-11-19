# ThermoProcess

**An experimental process mining platform combining thermodynamic-inspired modeling, energy-based analysis, information theory, and context discovery.**

## Overview

ThermoProcess is an experimental process mining platform designed to analyze business process behavior through event logs.

Beyond traditional process discovery, the platform explores a thermodynamic-inspired analytical approach to study process behavior, quantify transition-related energy indicators, identify anomalies, and investigate how contextual variables influence process execution.

The objective is to provide additional perspectives for understanding process performance, complexity, and behavioral patterns.

## Key Features

### 1. Event Log Ingestion & Mapping
- Import event log datasets.
- Map source columns to standard process mining attributes.
- Configure case identifiers, activities, timestamps, and resources.
- Preview and validate imported data.

### 2. Process Analysis
- Discover process models from event logs.
- Analyze process variants and execution traces.
- Calculate transition and trace-level energy indicators.
- Explore process behavior through analytical metrics.
- Identify potentially anomalous traces.

### 3. Energy-Based Process Visualization
- Visualize process flows using directly connected activity graphs.
- Represent transition-related energy indicators through graph visualization.
- Explore transition statistics and trace-level results.

### 4. Context Discovery
- Evaluate contextual variables and their influence on process behavior.
- Explore information-theoretic measures such as entropy and mutual information.
- Calculate context impact scores.
- Identify transitions influenced by contextual attributes.

### 5. Interactive Process Explorer
- Explore discovered process models interactively.
- Adjust graph layouts.
- Save visualization layouts.
- Investigate critical paths and selected process sequences.

## Technical Architecture

ThermoProcess follows a frontend/backend architecture.

| Layer | Technologies |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, TypeScript, Vite |
| Data Processing | Python, Pandas |
| Database | SQLAlchemy, SQLite |
| Visualization | Interactive process graphs |

### Project Structure

```text
ThermoProcess/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   └── services/
├── notebooks/
├── process-mining-ui/
│   └── src/
│       ├── api/
│       ├── components/
│       └── pages/
├── .gitignore
├── package.json
└── README.md
```

## Experimental Approach

ThermoProcess explores a thermodynamic-inspired analytical framework for process mining.

The experimental model investigates process execution through energy-related indicators, entropy, behavioral variability, and contextual influence.

These indicators are intended as analytical abstractions inspired by statistical physics and information theory, rather than validated physical measurements.

## Technologies

- Python
- FastAPI
- React
- TypeScript
- Vite
- Pandas
- SQLAlchemy
- SQLite
- Git

## Project Status

ThermoProcess is an ongoing experimental project. Its analytical models, visualizations, and context discovery methods are being progressively developed and refined.

## Future Improvements

- Extend analytical and statistical evaluation.
- Improve anomaly detection methods.
- Enhance context discovery and interpretation.
- Add comparative process analysis.
- Expand interactive visualization capabilities.
- Improve testing and documentation.

---

**ThermoProcess — Exploring business process behavior through energy-based and information-theoretic perspectives.**