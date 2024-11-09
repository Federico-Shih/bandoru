from aws_lambda_powertools import Logger
from shared import notification_service

logger = Logger()

def lambda_handler(event: dict, context: LambdaContext) -> dict:
    try:
        for message in event['Records']:
            body = message['body']
            notification_service.register_failed_webhook_call(
                bandoru_id=body['bandoru-id'],
                webhook_url=body['webhook'],
                timestamp=body['timestamp']
            )
    except Exception as e:
        logger.error(f"Could not save failed webhook call to database: {e}")
    return {
        'statusCode': 200,
        'body': ''
    }
