const jwt = require('jsonwebtoken');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

let jwtSecret;
const ssmClient = new SSMClient();

exports.handler = async (event) => {
    try {
        // Skip auth in development
        if (process.env.NODE_ENV === 'development') {
            return allowPolicy('dev-user');
        }
        
        const token = extractToken(event);
        if (!token) {
            return denyPolicy();
        }
        
        if (!jwtSecret) {
            const response = await ssmClient.send(new GetParameterCommand({
                Name: process.env.JWT_SECRET_PARAM,
                WithDecryption: true
            }));
            jwtSecret = response.Parameter.Value;
        }
        
        const decoded = jwt.verify(token, jwtSecret);
        return allowPolicy(decoded.sub || 'user');
        
    } catch (error) {
        console.log('Auth failed:', error.message);
        return denyPolicy();
    }
};

function extractToken(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    return authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
}

function allowPolicy(principalId) {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: '*'
            }
        }
    };
}

function denyPolicy() {
    return {
        principalId: 'unauthorized',
        policyDocument: {
            Version: '2012-10-17',
            Statement: {
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: '*'
            }
        }
    };
}