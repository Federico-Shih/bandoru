from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, CORSConfig
from aws_lambda_powertools.event_handler.openapi.params import Query, Body
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from typing_extensions import Annotated

from shared import bandoru_service, bookmark_service
from shared.auth_jwt import get_username_from_headers
from shared.dto import BandoruDTO

tracer = Tracer()
logger = Logger()

cors_config = CORSConfig(allow_origin="*", allow_headers=["*"], expose_headers=["*"])
app = APIGatewayHttpResolver(enable_validation=True, cors=cors_config, debug=True)


@app.post("/users/<user_id>/bookmarks")
@tracer.capture_method
def post_bookmarks(user_id: str, bandoru_id: Annotated[str, Body(min_length=1, max_length=32)]):
    logged_user = get_username_from_headers(app.current_event.headers)
    bookmark_service.add(bandoru_id, user_id, logged_user)

    return bandoru_id, 201


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    logger.debug(event)
    return app.resolve(event, context)
