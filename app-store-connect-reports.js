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

const main = async () => {
    const token = await createToken();

    const answer = await select({
        message: 'What do you want to do?',
        choices: [
            { name: 'Read Report Requests', value: 'readReportRequests' },
            { name: 'Request Reports', value: 'requestReports' }
        ]
    });
    
    if (answer === 'readReportRequests') {
        const reports = await readReportRequests(token);
        let choices =reports.data.map(it => ({name: `${it.attributes.accessType} - ${it.id}`, value: it.id} ))

        let id = await select({
            message: 'Select report to read',
            choices
        });
        const reportRequestDetails = await readReportRequestDetails(token, id);
        choices = reportRequestDetails.data.map(it => ({name: `${it.attributes.name} (${it.attributes.category}) - ${it.id}`, value: it.id} ))
        id = await select({
            message: 'Select report to read',
            choices
        });
        const reportInformation = await readReportInformations(token, id);
        console.log(JSON.stringify(reportInformation, null, 2));
    } 
    else if (answer === 'requestReports') {
        const type = await select({
            message: 'Select report type',
            choices: [
                { name: 'Ongoing', value: 'ONGOING' },
                { name: 'Daily', value: 'DAILY' },
            ]
        })
        const res = await requestReports(token, type);
        console.log(`Requested ${type} report, id: ${res.data.id}`);
    }
}

main();