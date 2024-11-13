import json
from aws_lambda_powertools import Logger
from shared import database
from aws_lambda_powertools.utilities.typing import LambdaContext


logger = Logger()


def register_failed_webhook_call(bandoru_id: str, webhook_url: str, timestamp: str):
    pk = f"FAILED_WEBHOOK_CALL#{bandoru_id}"
    sk = f"{timestamp}#{webhook_url}"
    item = {
        "PK": pk,
        "SK": sk,
        "bandoru_id": bandoru_id,
        "webhook_url": webhook_url,
        "timestamp": timestamp,
    }
    database.db_table.put_item(Item=item)


def lambda_handler(event: dict, context: LambdaContext) -> dict:
    try:
        for message in event["Records"]:
            body = json.loads(message["body"])
            logger.info(f"Received message: {message["body"]}")
            register_failed_webhook_call(
                bandoru_id=body["bandoru_id"],
                webhook_url=body["webhook"],
                timestamp=body["timestamp"],
            )
    except Exception as e:
        logger.error(f"Could not save failed webhook call to database", exc_info=e)
        return {"statusCode": 500, "body": f"{e}"}
    return {"statusCode": 200, "body": ""}
