# src/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
import logging

_log = logging.getLogger(__name__)

_sched: BackgroundScheduler | None = None


def start_scheduler(interval_seconds: int, job_func) -> None:
    """
    Start global BackgroundScheduler (idempotent).

    Parameters
    ----------
    interval_seconds : int
        How often to run *job_func*.
    job_func : callable
        Zero‑arg function (or functools.partial) to execute.
    """
    global _sched
    if _sched and _sched.running:
        return  # already running

    _sched = BackgroundScheduler(
        executors={"default": ThreadPoolExecutor(max_workers=2)},
        daemon=True,
    )
    _sched.add_job(job_func, "interval", seconds=interval_seconds)
    _sched.start()
    _log.debug("Background scheduler started (%ss interval)", interval_seconds)
