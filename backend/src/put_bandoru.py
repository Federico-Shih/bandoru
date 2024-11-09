from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import bandoru_service
from shared.forms import CreateBandoruForm
from shared.auth_jwt import get_username_from_headers

tracer = Tracer()
logger = Logger()

cors_config = CORSConfig(allow_origin="*", allow_headers=["*"], expose_headers=["*"])
app = APIGatewayHttpResolver(enable_validation=True, cors=cors_config, debug=True)


@app.put("/bandoru/<bandoru_id>")
@tracer.capture_method
def put_bandoru(bandoru_id:str, form: CreateBandoruForm):
    username = get_username_from_headers(app.current_event.headers)
    try:
        webhooks = bandoru_service.get_webhooks(bandoru_id, username)
        send_update_notification(bandoru_id, webhooks)
    except Exception as e:
        logger.warn(f"Could not send notification for this bandoru. Error: {e}")
    return bandoru_service.replace(bandoru_id, form, username), 200


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
