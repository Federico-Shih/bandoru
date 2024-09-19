from typing import Annotated

from aws_lambda_powertools import Tracer, Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import NotFoundError
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

import bandoru_service
from forms import CreateBandoruForm
from dto import BandoruDTO

tracer = Tracer()
logger = Logger()
app = APIGatewayHttpResolver(enable_validation=True, debug=True)


@app.post("/bandoru")
@tracer.capture_method
def post_bandoru(form: CreateBandoruForm):
    return bandoru_service.create(form), 201


@app.get("/bandoru")
@tracer.capture_method
def get_all_bandorus():
    bandorus = bandoru_service.get_all()

    if len(bandorus) == 0:
        return None, 204

    return [BandoruDTO.from_model(ban) for ban in bandorus]


@app.get("/bandoru/<bandoru_id>")
@tracer.capture_method
def get_bandoru(bandoru_id: str):
    bandoru = bandoru_service.get(bandoru_id)

    if bandoru is None:
        raise NotFoundError

    return BandoruDTO.from_model(bandoru)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
