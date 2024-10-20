import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import AWS from 'aws-sdk';


const region = 'us-east-1';
const userPoolId = 'us-east-1_d5McTviEF';
const clientId = '42aoivr2cjkgs0bunthdouqn0j';

const cognito = new AWS.CognitoIdentityServiceProvider({ region });

const client = jwksClient({
    jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}



export async function handler(event) {
    const token = event.authorizationToken;
    if (!token) {
        return generatePolicy('anonymous', 'Allow', event.methodArn, { user: 'anonymous' });
    }

    try {
        const decoded = await verifyToken(token);
        const userInfo = await validateWithCognito(decoded);
        return generatePolicy(decoded.sub, 'Allow', event.methodArn, userInfo);

    } catch (error) {
        console.log('Token validation failed:', error);
        return generatePolicy('anonymous', 'Allow', event.methodArn, { user: 'anonymous' });
    }
};

const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) {
            return reject('Invalid token');
        }

        getKey(decoded.header, (err, key) => {
            if (err) return reject(err);

            jwt.verify(token, key, {
                audience: clientId,
                issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
            }, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded);
            });
        });
    });
};

const validateWithCognito = (decodedToken) => {
    return new Promise((resolve, reject) => {
        cognito.getUser({ AccessToken: decodedToken }, (err, data) => {
            if (err) return reject(err);
            resolve({
                username: data.Username,
                attributes: data.UserAttributes
            });
        });
    });
};

const generatePolicy = (principalId, effect, resource, context = {}) => {
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }
        ]
    };

    return {
        principalId,
        policyDocument,
        context
    };
};
