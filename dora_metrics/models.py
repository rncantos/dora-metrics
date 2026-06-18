from pydantic import BaseModel, Field

class DORAMetricsResult(BaseModel):
    deployment_frequency: str = Field(description="Con qué frecuencia se despliega código (ej., 'Diario', 'Semanal')")
    lead_time_for_changes: str = Field(description="Tiempo desde el commit hasta producción (ej., '2 días')")
    mean_time_to_recovery: str = Field(description="Tiempo para restaurar el servicio tras un incidente (ej., '4 horas')")
    change_failure_rate: str = Field(description="Porcentaje de despliegues que causan fallos en producción (ej., '15%')")
    analysis_summary: str = Field(description="Resumen breve del rendimiento DORA del repositorio.")
