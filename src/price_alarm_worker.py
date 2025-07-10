# src/price_alarm_worker.py
import sqlite3, os, smtplib, time
from email.message import EmailMessage
from pathlib import Path
from loguru import logger                         # ← NEW

DB = Path("data/price_alerts.sqlite")
DB.parent.mkdir(parents=True, exist_ok=True)

def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.execute("""CREATE TABLE IF NOT EXISTS alerts(
                       id      INTEGER PRIMARY KEY AUTOINCREMENT,
                       email   TEXT NOT NULL,
                       url     TEXT NOT NULL UNIQUE,
                       target  INTEGER NOT NULL
                   )""")
    conn.commit()
    return conn

# ------------------------------------------------------------------ public
def add_alert(prod: dict, target: int, email: str) -> None:
    with _conn() as c:
        c.execute("INSERT OR REPLACE INTO alerts(email,url,target) VALUES (?,?,?)",
                  (email, prod["url"], target))
    logger.info("🔔  Alert stored for {}  ≤ PKR {}", prod["url"], target)

def check_alerts() -> None:
    from src.daraz_scraper import _price_from_page   # reuse helper

    logger.debug("⏰  Price‑check tick")
    with _conn() as c:
        rows = c.execute("SELECT id,email,url,target FROM alerts").fetchall()

    if not rows:
        logger.debug("⏳  No alerts in DB – nothing to do")
        return

    for _id, email, url, target in rows:
        try:
            price = int(_price_from_page(url))
            logger.debug("… {} → current PKR {}", url, price)

            if 0 < price <= target:
                _send_mail(email, url, price, target)
                with _conn() as c:
                    c.execute("DELETE FROM alerts WHERE id=?", (_id,))
                logger.success("✅ Alert triggered and removed for {}", url)
        except Exception as e:
            logger.warning("⚠️  Could not check {}  ({})", url, e)


# ------------------------------------------------------------------ e‑mail
def _send_mail(to_addr: str, url: str, price: int, target: int) -> None:
    user, pwd = os.getenv("SMTP_USER"), os.getenv("SMTP_PASS")
    if not (user and pwd):
        logger.error("SMTP credentials missing – e‑mail skipped")
        return

    msg            = EmailMessage()
    msg["Subject"] = f"💰 Price hit PKR {price} (target {target})"
    msg["From"]    = user
    msg["To"]      = to_addr
    msg.set_content(f"The item is now PKR {price}\n\n{url}")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(user, pwd)
        s.send_message(msg)

    logger.info("📧  Mail sent to {} for {}", to_addr, url)
