# src/notifier.py --------------------------------------------------
import smtplib, email.message, logging
log = logging.getLogger(__name__)

SMTP = ("smtp.gmail.com", 587, "your@gmail.com", "app‑pass")

def notify(to, title, price, url):
    msg = email.message.EmailMessage()
    msg["Subject"] = f"Price alert – now PKR {price}"
    msg["From"] = SMTP[2]; msg["To"] = to
    msg.set_content(f"{title}\nNow at PKR {price}\n{url}")
    try:
        with smtplib.SMTP(*SMTP[:2]) as s:
            s.starttls(); s.login(SMTP[2], SMTP[3]); s.send_message(msg)
        log.info("Alert e‑mail sent to %s", to)
    except Exception as e:
        log.error("Mail failed: %s", e)
