from typing import List
from concurrent.futures import ThreadPoolExecutor
import json
import requests
import os
from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

"""
{
    "Records": [
        {
            "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
            "body": "{
                       "type": "bandoru-update-notification",
                       "bandoru_id": <uuid>,
                       "webhook": <url>,
                       "timestamp": ...
                     }",
        },
        {
            "messageId": "2e1424d4-f796-459a-8184-9c92662be6da",
            "body": "{
                       "type": "bandoru-update-notification",
                       "bandoru_id": <uuid>,
                       "webhook": <url>,
                       "timestamp": ...
                     }.",
        }
    ]
}
"""

FRONTEND_URL = os.getenv("FRONTEND_URL")

tracer = Tracer()
logger = Logger()


@tracer.capture_method
def notify_webhook(event: dict):
    body = event["body"]
    message = json.loads(body)
    webhook = message.get("webhook")
    try:
        request = requests.post(
            webhook,
            json={
                "content": f"['{message['desc']}']({FRONTEND_URL}/share/{message['bandoru_id']}) has been updated",
                "bandoru_id": message.get("bandoru_id"),
                "timestamp": message.get("timestamp"),
            },
            timeout=5,
        )
        if request.status_code > 299:
            logger.error(
                f"Failed to notify webhook {webhook} with status code {request.status_code}"
            )
            return event["messageId"]
        return None
    except Exception as e:
        logger.error("Failed to notify webhook", exc_info=e)
        return event["messageId"]


@logger.inject_lambda_context()
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    results = None
    with ThreadPoolExecutor() as executor:
        results = list(executor.map(notify_webhook, event["Records"]))
    failed_ids = list(filter(lambda x: x is not None, results))
    logger.info("Failed ids " + str(failed_ids))
    return map_failed_batches(failed_ids)


def map_failed_batches(failed_ids: List[str]):
    return {
        "batchItemFailures": [
            {
                "itemIdentifier": failed_id,
            }
            for failed_id in failed_ids
        ]
    }
