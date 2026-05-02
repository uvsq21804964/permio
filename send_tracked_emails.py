#!/usr/bin/env python3

import argparse
import csv
import html
import imaplib
import json
import mimetypes
import os
import re
import smtplib
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote_plus, urljoin
from urllib.request import Request, urlopen

SMTP_HOST = "smtp0001.neo.space"
SMTP_PORT = 587
IMAP_HOST = "imap0001.neo.space"
IMAP_PORT = 993

SENDER_DISPLAY_NAME = "Tom from MagicHango"
SIGNATURE_IMAGE_PATH = Path(__file__).with_name("public") / "Icone.png"
SIGNATURE_IMAGE_WIDTH = 120
SENT_MAILBOX_CANDIDATES = ("Sent", "Sent Mail", "Sent Messages", "INBOX.Sent")

DEFAULT_APP_URL = "https://magichango.com"
DEFAULT_SUBJECT = "Message automatique"
DEFAULT_CAMPAIGN_LABEL = "Script Neo Mail"


def load_dotenv_file(path):
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


class HtmlToTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.parts.append("\n")
        elif tag in {"p", "div"} and self.parts:
            self.parts.append("\n\n")

    def handle_endtag(self, tag):
        if tag in {"p", "div"}:
            self.parts.append("\n\n")

    def handle_data(self, data):
        text = data.strip()
        if text:
            self.parts.append(text)

    def get_text(self):
        text = "".join(self.parts)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"


def html_to_text(html_body):
    parser = HtmlToTextParser()
    parser.feed(html_body)
    return parser.get_text()


def normalize_base_url(value):
    return (value or DEFAULT_APP_URL).strip().rstrip("/") + "/"


def build_tracking_id(recipient):
    return f"{recipient}-{int(time.time())}"


def build_body_html(prenom):
    return f"""<p>Bonjour {html.escape(prenom)},</p>
    <p>Ceci est un message envoye automatiquement depuis mon script.</p>
"""


def build_signature_html(image_cid):
    return f"""\
    <p style="margin-top:16px;">
      <b style="font-weight:bold;">Tom A. | MagicHango</b><br>
      <a href="https://magichango.com">magichango.com</a><br>
      <img
        src="cid:{image_cid[1:-1]}"
        alt="MagicHango"
        width="{SIGNATURE_IMAGE_WIDTH}"
        style="display:block; width:{SIGNATURE_IMAGE_WIDTH}px; max-width:{SIGNATURE_IMAGE_WIDTH}px; height:auto; margin-top:8px;"
      >
    </p>
"""


def build_tracking_pixel_html(tracking_id, app_url):
    tracking_url = urljoin(
        normalize_base_url(app_url),
        f"track/open?id={quote_plus(tracking_id)}",
    )

    return f"""\
<img
  src="{html.escape(tracking_url, quote=True)}"
  width="1"
  height="1"
  style="display:none;"
  alt=""
>
"""


def build_full_html(body_html, signature_html, tracking_pixel_html):
    body_html = body_html.strip()
    signature_html = signature_html.strip()
    tracking_pixel_html = tracking_pixel_html.strip()

    return f"""\
<!doctype html>
<html>
  <body>
{body_html}
{signature_html}
{tracking_pixel_html}
  </body>
</html>
"""


def build_email(sender_email, recipient, subject, prenom, tracking_id, app_url):
    message_id = make_msgid(domain=sender_email.split("@")[-1])
    image_cid = make_msgid(domain=sender_email.split("@")[-1])

    body_html = build_body_html(prenom)
    signature_html = build_signature_html(image_cid)
    tracking_pixel_html = build_tracking_pixel_html(tracking_id, app_url)
    html_body = build_full_html(body_html, signature_html, tracking_pixel_html)
    text_body = html_to_text(html_body).strip() + "\n"

    msg = EmailMessage()
    msg["From"] = formataddr((SENDER_DISPLAY_NAME, sender_email))
    msg["To"] = recipient
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = message_id
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    if not SIGNATURE_IMAGE_PATH.exists():
        raise FileNotFoundError(f"Image de signature introuvable : {SIGNATURE_IMAGE_PATH}")

    content_type, _ = mimetypes.guess_type(SIGNATURE_IMAGE_PATH)
    if not content_type:
        content_type = "application/octet-stream"
    maintype, subtype = content_type.split("/", 1)

    with SIGNATURE_IMAGE_PATH.open("rb") as image_file:
        msg.get_payload()[1].add_related(
            image_file.read(),
            maintype=maintype,
            subtype=subtype,
            cid=image_cid,
            disposition="inline",
        )

    return msg


def append_to_sent(sender_email, sender_password, msg):
    last_error = None

    with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT) as imap:
        imap.login(sender_email, sender_password)

        for mailbox in SENT_MAILBOX_CANDIDATES:
            status, _ = imap.append(
                mailbox,
                "\\Seen",
                imaplib.Time2Internaldate(time.time()),
                msg.as_bytes(),
            )

            if status == "OK":
                return mailbox

            last_error = f"Impossible d'ajouter le mail dans {mailbox!r}"

    raise RuntimeError(last_error or "Impossible d'ajouter le mail aux envoyes")


def register_sent_email(
    app_url,
    tracking_token,
    tracking_id,
    recipient,
    prenom,
    subject,
    campaign_label,
    sent_at,
):
    register_url = urljoin(normalize_base_url(app_url), "api/email-tracking/register")
    payload = {
        "trackingId": tracking_id,
        "recipientEmail": recipient,
        "firstName": prenom,
        "subject": subject,
        "campaignLabel": campaign_label,
        "sentAt": sent_at,
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    if tracking_token:
        headers["Authorization"] = f"Bearer {tracking_token}"

    request = Request(
        register_url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    with urlopen(request, timeout=15) as response:
        if response.status >= 400:
            raise RuntimeError(f"Erreur API tracking : HTTP {response.status}")


def send_email(
    sender_email,
    sender_password,
    recipient,
    subject,
    prenom,
    app_url,
    tracking_token,
    campaign_label,
):
    tracking_id = build_tracking_id(recipient)
    sent_at = datetime.now(timezone.utc).isoformat()
    msg = build_email(
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        prenom=prenom,
        tracking_id=tracking_id,
        app_url=app_url,
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(sender_email, sender_password)
        smtp.send_message(msg, from_addr=sender_email, to_addrs=[recipient])

    sent_mailbox = append_to_sent(sender_email, sender_password, msg)

    register_sent_email(
        app_url=app_url,
        tracking_token=tracking_token,
        tracking_id=tracking_id,
        recipient=recipient,
        prenom=prenom,
        subject=subject,
        campaign_label=campaign_label,
        sent_at=sent_at,
    )

    return sent_mailbox, tracking_id


def read_csv_and_send(
    csv_path,
    sender_email,
    sender_password,
    app_url,
    tracking_token,
    campaign_label,
    dry_run=False,
):
    csv_file = Path(csv_path)

    if not csv_file.exists():
        raise FileNotFoundError(f"Fichier introuvable : {csv_path}")

    sent_count = 0
    error_count = 0

    with csv_file.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        required_columns = {"email", "prenom"}
        missing_columns = required_columns - set(reader.fieldnames or [])

        if missing_columns:
            raise ValueError(
                f"Colonnes manquantes dans le CSV : {', '.join(missing_columns)}"
            )

        for index, row in enumerate(reader, start=2):
            recipient = row.get("email", "").strip()
            prenom = row.get("prenom", "").strip() or "Bonjour"
            subject = (row.get("subject") or DEFAULT_SUBJECT).strip()

            if not recipient or not subject:
                print(f"[Ligne {index}] Ignoree : email ou sujet vide.")
                error_count += 1
                continue

            try:
                if dry_run:
                    tracking_id = build_tracking_id(recipient)
                    build_email(
                        sender_email=sender_email,
                        recipient=recipient,
                        subject=subject,
                        prenom=prenom,
                        tracking_id=tracking_id,
                        app_url=app_url,
                    )
                    print(
                        f"[TEST] Email pret pour {recipient} "
                        f"- Sujet : {subject} - Tracking : {tracking_id}"
                    )
                else:
                    sent_mailbox, tracking_id = send_email(
                        sender_email=sender_email,
                        sender_password=sender_password,
                        recipient=recipient,
                        subject=subject,
                        prenom=prenom,
                        app_url=app_url,
                        tracking_token=tracking_token,
                        campaign_label=campaign_label,
                    )
                    print(
                        f"[OK] Email envoye a {recipient}, "
                        f"copie dans {sent_mailbox}, tracking enregistre "
                        f"({tracking_id})"
                    )

                sent_count += 1

            except Exception as e:
                print(f"[ERREUR] Ligne {index}, destinataire {recipient} : {e}")
                error_count += 1

    print()
    print("Resume")
    print("------")
    print(f"Emails traites avec succes : {sent_count}")
    print(f"Erreurs / lignes ignorees : {error_count}")


def main():
    load_dotenv_file(Path(__file__).with_name(".env"))

    parser = argparse.ArgumentParser(
        description=(
            "Envoie des emails depuis un CSV via Neo Mail, copie dans les "
            "envoyes Neo et enregistre le tracking dans la BDD MagicHango."
        )
    )

    parser.add_argument(
        "csv",
        help="Chemin vers le fichier CSV, par exemple contacts.csv",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Teste la lecture du CSV sans envoyer d'email ni ecrire en BDD",
    )

    parser.add_argument(
        "--campaign",
        default=os.getenv("EMAIL_TRACKING_CAMPAIGN", DEFAULT_CAMPAIGN_LABEL),
        help="Libelle de campagne affiche dans le dashboard",
    )

    args = parser.parse_args()

    sender_email = os.getenv("NEO_EMAIL", "").strip()
    sender_password = os.getenv("NEO_PASSWORD", "").strip()
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", DEFAULT_APP_URL).strip()
    tracking_token = os.getenv("EMAIL_TRACKING_WRITE_TOKEN", "").strip()

    if not sender_email:
        raise EnvironmentError("Variable d'environnement manquante : NEO_EMAIL")

    if not sender_password:
        raise EnvironmentError("Variable d'environnement manquante : NEO_PASSWORD")

    read_csv_and_send(
        csv_path=args.csv,
        sender_email=sender_email,
        sender_password=sender_password,
        app_url=app_url,
        tracking_token=tracking_token,
        campaign_label=args.campaign,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
