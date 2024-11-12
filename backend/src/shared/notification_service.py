import boto3
from uuid import uuid4
import json
import os
from datetime import datetime, timezone
from shared import database
from shared.utils import uuid4_to_base64

sqs = boto3.resource('sqs')
queue = sqs.Queue(os.environ['UPDATE_NOTIFICATION_SQS'])

def send_update_notification(bandoru_id: str, urls: list[str], desc: Optional[str]):
    if len(urls) == 0:
        return
    queue.send_messages(
        Entries=[
            {
                'Id': uuid4_to_base64(uuid4()),
                'MessageBody': json.dumps({
                    'bandoru_id': bandoru_id,
                    'desc': desc,
                    'webhook': url,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'type': 'bandoru-update-notification'
                })
            }
            for url in urls
        ]
    )

def register_failed_webhook_call(bandoru_id: str, webhook_url: str, timestamp: str):
    pk = f"FAILED_WEBHOOK_CALL#{bandoru_id}#{webhook_url}"
    sk = timestamp
    item = {
        "PK": pk,
        "SK": sk,
        "bandoru_id": bandoru_id,
        "webhook_url": webhook_url,
        "timestamp": timestamp
    }
    database.db_table.put_item(Item=item)

