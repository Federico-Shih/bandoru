import os
from typing import Optional

import cognitojwt
from aws_lambda_powertools import Logger

logger = Logger()

# Cognito user pool information
USER_POOL_ID = os.environ['USER_POOL_ID']
APP_CLIENT_ID = os.environ['APP_CLIENT_ID']
COGNITO_REGION = 'us-east-1'

def get_jwt_claims(token: str) -> dict:
    try:
        return cognitojwt.decode(
            token=token,
            region=COGNITO_REGION,
            app_client_id=APP_CLIENT_ID,
            userpool_id=USER_POOL_ID,
        )
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        return {}

def get_username_from_token(token: str) -> Optional[str]:
    claims = get_jwt_claims(token)
    return claims.get('cognito:username', None)

def get_username_from_headers(headers: dict[str,str]) -> Optional[str]:
    auth_header = headers.get('Authorization', None)
    splitted = auth_header.split(" ") if auth_header else None
    token = auth_header.split(" ")[1] if splitted and len(splitted) > 1 else None

    return get_username_from_token(token) if token else None