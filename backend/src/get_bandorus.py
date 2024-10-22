from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, CORSConfig
from aws_lambda_powertools.event_handler.openapi.params import Query
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from typing_extensions import Annotated

from shared import bandoru_service
from shared.dto import BandoruDTO

tracer = Tracer()
logger = Logger()

cors_config = CORSConfig(allow_origin="*", allow_headers=["*"], expose_headers=["*"])
app = APIGatewayHttpResolver(enable_validation=True, cors=cors_config, debug=True)


@app.get("/bandoru")
@tracer.capture_method
def get_bandorus(user: Annotated[str, Query(min_length=1)]):
    bandorus = bandoru_service.get_by_user(user)

    if bandorus is None or len(bandorus) == 0:
        return None, 204

    return [BandoruDTO.from_model(bandoru) for bandoru in bandorus]


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    logger.debug(event)
    return app.resolve(event, context)
