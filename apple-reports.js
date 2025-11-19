import {select} from '@inquirer/prompts';
import { 
    createToken, 
    readReportRequests, 
    readReportRequestDetails, 
    readReportInformations, 
    readReportSegment, 
    requestReports 
} from './lib/app-store-connect.js';
import 'dotenv/config';

const handleReadReports = async (token) => {
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
    const reportName = choices.find(it => it.value === id).name;
    const reportInformation = await readReportInformations(token, id);

    choices = reportInformation.data.map(it => ({name: `${it.attributes.granularity} - ${it.attributes.processingDate}`, value: it.id}))

    id = await select({
        message: `${reportName} - Select instance to read`,
        choices
    })

    const reportSegments = await readReportSegment(token, id);
    console.log(`Download report clicking on the link`)
    console.log('\n\n');
    for (const segment of reportSegments.data) {
        console.log(`⬇️⬇️ ${segment.attributes.sizeInBytes} B ⬇️⬇️`);
        console.log(`${segment.attributes.url}`);
        console.log('\n\n');
    }
}

const handleRequestReports = async (token) => {
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

const main = async () => {
    const token = await createToken();

    const answer = await select({
        message: 'What do you want to do?',
        choices: [
            { name: 'Read Report Requests', value: 'readReportRequests' },
            { name: 'Request Reports', value: 'requestReports' }
        ]
    });
    
    if (answer === 'readReportRequests') 
        await handleReadReports(token);
    else if (answer === 'requestReports') 
        await handleRequestReports(token);
}

main();