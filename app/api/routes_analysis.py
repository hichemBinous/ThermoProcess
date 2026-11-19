from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from services.process_mining_service import ProcessMiningService
from services.energy_service import EnergyService
router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.get("/{datasource_id}/preview-log")
def preview_event_log(datasource_id: int, db: Session = Depends(get_db)):
    try:
        result = ProcessMiningService.load_event_log(db, datasource_id)
        df = result["dataframe"]

        return {
            "message": "Event log loaded successfully",
            "rows": len(df),
            "columns": list(df.columns),
            "preview": df.head(10).to_dict(orient="records")
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("PREVIEW LOG ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/stats")
def get_stats(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return ProcessMiningService.get_basic_statistics(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("STATS ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/dfg")
def get_dfg(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return ProcessMiningService.discover_dfg(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("DFG ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/energy/transitions")
def get_transition_energies(datasource_id: int, db: Session = Depends(get_db)):
    try:
        stats = EnergyService.compute_transition_statistics(db, datasource_id)
        return {
            "count": len(stats),
            "transitions": stats[:200]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("ENERGY TRANSITIONS ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{datasource_id}/energy/traces")
def get_trace_energies(datasource_id: int, db: Session = Depends(get_db)):
    try:
        traces = EnergyService.compute_trace_energies(db, datasource_id)
        return {
            "count": len(traces),
            "traces": traces[:100]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("TRACE ENERGY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{datasource_id}/energy/entropy")
def get_entropy(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return EnergyService.compute_entropy(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("ENTROPY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/energy/summary")
def get_energy_summary(datasource_id: int, db: Session = Depends(get_db)):
    try:
        summary = EnergyService.compute_energy_summary(db, datasource_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("ENERGY SUMMARY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/energy/anomalies")
def get_trace_anomalies(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return EnergyService.compute_trace_anomaly_scores(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("TRACE ANOMALY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/energy/dfg")
def get_energy_dfg(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return EnergyService.compute_energy_dfg(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("ENERGY DFG ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))