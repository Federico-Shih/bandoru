from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import bandoru_service
from shared.forms import CreateBandoruForm
from shared.auth_jwt import get_username_from_token

tracer = Tracer()
logger = Logger()

cors_config = CORSConfig(allow_origin="*", allow_headers=["*"], expose_headers=["*"])
app = APIGatewayHttpResolver(enable_validation=True, cors=cors_config, debug=True)


@app.post("/bandoru")
@tracer.capture_method
def post_bandoru(form: CreateBandoruForm):
    auth_header = app.current_event.headers.get('Authorization', None)
    splitted = auth_header.split(" ") if auth_header else None
    token = splitted[1] if splitted and len(splitted) > 1 else None
    username = get_username_from_token(token) if token else None
    return bandoru_service.create(form, username), 201


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
