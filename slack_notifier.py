import os
import httpx
from datetime import datetime

def send_dora_slack_alert(repo_name: str, metrics: dict, webhook_url: str = None) -> bool:
    """
    Sends a beautifully formatted DORA metrics alert to a Slack channel using Block Kit.
    """
    url = webhook_url or os.getenv("SLACK_WEBHOOK_URL")
    if not url:
        print("No Slack webhook URL provided.")
        return False
        
    # Extract metrics safely
    df = metrics.get('df', 'N/A')
    ltc = metrics.get('ltc', 'N/A')
    mttr = metrics.get('mttr', 'N/A')
    cfr = metrics.get('cfr', 'N/A')
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Slack Block Kit structure
    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚀 DORA Metrics Alert: {repo_name}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Time of report:* {timestamp}\nHere is the latest snapshot of your team's delivery performance."
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*📦 Deployment Frequency*\n`{df}`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*⏱ Lead Time for Changes*\n`{ltc}`"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*🔥 MTTR*\n`{mttr}`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*🛑 Change Failure Rate*\n`{cfr}`"
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Powered by DORA Metrics AI 🤖"
                    }
                ]
            }
        ]
    }
    
    try:
        response = httpx.post(url, json=payload, timeout=5.0)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Failed to send Slack alert: {e}")
        return False
