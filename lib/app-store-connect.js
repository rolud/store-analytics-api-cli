import fs from 'fs';
import jwt from 'jsonwebtoken';
import {select} from '@inquirer/prompts';
import 'dotenv/config';

const APP_STORE_CONNECT_API_URL = 'https://api.appstoreconnect.apple.com/v1';
const APP_ID = process.env.APP_STORE_CONNECT_APP_ID;

const createToken = async () => {

    const privateKey = fs.readFileSync('./secrets/apple-private-key.p8', 'utf8');
    const header = {
        alg: "ES256",
        kid: process.env.APP_STORE_CONNECT_APY_KEY_ID,
        typ: "JWT"
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: process.env.APP_STORE_CONNECT_API_KEY_ISSUER_ID,
        iat: now,
        exp: now + 120, // 2 minutes long token
        aud: 'appstoreconnect-v1',
    }

    return jwt.sign(payload, privateKey, { algorithm: 'ES256', header });
}

const getApps = async (token) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/apps`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    console.log(data);
    return data;
}

const readReportRequests = async (token) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/apps/${APP_ID}/analyticsReportRequests`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

const readReportRequestDetails = async (token, id) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/analyticsReportRequests/${id}/reports`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

const readReportInformations = async (token, id) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/analyticsReports/${id}/instances`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

const readReportInstance = async (token, id) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/analyticsReportInstances/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

const readReportSegment = async (token, id) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/analyticsReportInstances/${id}/segments`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}


const requestReports = async (token, type) => {
    const response = await fetch(`${APP_STORE_CONNECT_API_URL}/analyticsReportRequests`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: {
                type: 'analyticsReportRequests',
                attributes: {
                    accessType :  type === 'ONGOING' ? 'ONGOING' : 'ONE_TIME_SNAPSHOT',
                },
                relationships: {
                    app: {
                        data: {
                            type: 'apps',
                            id: APP_ID
                        }
                    }
                }
            }
        })
    });
    const data = await response.json();
    return data;
}


export {
    createToken,
    getApps,
    readReportRequests,
    readReportRequestDetails,
    readReportInformations,
    readReportInstance,
    readReportSegment,
    requestReports
}