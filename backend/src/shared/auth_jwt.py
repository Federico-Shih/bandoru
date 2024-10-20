import cognitojwt
import os
# Cognito user pool information
USER_POOL_ID = os.environ['USER_POOL_ID']
APP_CLIENT_ID = os.environ['APP_CLIENT_ID']
COGNITO_REGION = 'us-east-1'

def get_jwt_claims(token: str) -> dict:
    return cognitojwt.decode(
        token,
        region = COGNITO_REGION,
        userpool_id = USER_POOL_ID,
        app_client_id =APP_CLIENT_ID,
    )