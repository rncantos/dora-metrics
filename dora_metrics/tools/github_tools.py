import os
from typing import Dict, Any, List
from github import Github
from langchain_core.tools import tool

def get_github_client() -> Github:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise ValueError("La variable de entorno GITHUB_TOKEN no está configurada.")
    return Github(token)

@tool
def fetch_recent_pull_requests(repo_name: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Obtiene los pull requests recientes de un repositorio de GitHub (ej. 'owner/repo').
    Útil para calcular el Lead Time for Changes (Tiempo de entrega de cambios).
    """
    g = get_github_client()
    repo = g.get_repo(repo_name)
    prs = repo.get_pulls(state="closed", sort="updated", direction="desc")[:limit]
    
    result = []
    for pr in prs:
        if pr.merged_at:
            result.append({
                "number": pr.number,
                "title": pr.title,
                "created_at": pr.created_at.isoformat(),
                "merged_at": pr.merged_at.isoformat(),
                "merge_time_hours": round((pr.merged_at - pr.created_at).total_seconds() / 3600, 2)
            })
    return result

@tool
def fetch_recent_releases(repo_name: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Obtiene las releases (versiones/etiquetas) recientes de un repositorio.
    Útil para calcular la Deployment Frequency (Frecuencia de Despliegue).
    """
    g = get_github_client()
    repo = g.get_repo(repo_name)
    releases = repo.get_releases()[:limit]
    
    result = []
    for rel in releases:
        result.append({
            "tag_name": rel.tag_name,
            "created_at": rel.created_at.isoformat(),
            "published_at": rel.published_at.isoformat() if rel.published_at else None
        })
    return result

@tool
def fetch_recent_issues(repo_name: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Obtiene incidencias recientes (específicamente bugs) de un repositorio.
    Útil para calcular el Mean Time to Recovery (MTTR) y el Change Failure Rate.
    """
    g = get_github_client()
    repo = g.get_repo(repo_name)
    issues = repo.get_issues(state="all", sort="created", direction="desc")[:limit]
    
    result = []
    for issue in issues:
        # Ignorar pull requests que la API de GitHub también devuelve como issues
        if issue.pull_request is None:
            labels = [label.name.lower() for label in issue.labels]
            is_bug = any('bug' in label or 'incident' in label or 'fix' in label for label in labels)
            
            result.append({
                "number": issue.number,
                "title": issue.title,
                "state": issue.state,
                "is_bug": is_bug,
                "created_at": issue.created_at.isoformat(),
                "closed_at": issue.closed_at.isoformat() if issue.closed_at else None,
                "recovery_time_hours": round((issue.closed_at - issue.created_at).total_seconds() / 3600, 2) if issue.closed_at else None
            })
    return result
