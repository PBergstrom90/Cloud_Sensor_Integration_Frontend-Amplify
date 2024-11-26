import type { Handler } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.THINGSBOARD_API_KEY as string;
const ACCESS_TOKEN = process.env.THINGSBOARD_ACCESS_TOKEN as string;
const THINGSBOARD_TELEMETRY_URL = `http://localhost:8080/api/v1/${ACCESS_TOKEN}/telemetry`;

export const handler: Handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json',
    };
    try {
        // Step 1: Fetch metadata from AppSync
        const deviceQueryResponse = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: `query GetDevice {
                    getDevices(device_id: "${event.device_id}") {
                        device_id
                        owner
                    }
                }`,
            }),
        });
        if (!deviceQueryResponse.ok) {
            throw new Error(`Failed to fetch device metadata: ${deviceQueryResponse.statusText}`);
        }
        const deviceQueryData = await deviceQueryResponse.json();
        const deviceData = deviceQueryData?.data?.getDevices;
        if (!deviceData) {
            throw new Error('Device not found in AppSync');
        }
        console.log('Fetched device metadata:', deviceData);

        // Step 2: Prepare telemetry payload
        const telemetryPayload = {
            ts: event.timestamp,
            values: {
                temperature: event.temperature,
                humidity: event.humidity,
            },
        };
        console.log('Telemetry payload for ThingsBoard:', telemetryPayload);

        // Step 3: Push telemetry to ThingsBoard
        const thingsboardResponse = await fetch(THINGSBOARD_TELEMETRY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telemetryPayload),
        });
        if (!thingsboardResponse.ok) {
            throw new Error(`Failed to send telemetry to ThingsBoard: ${thingsboardResponse.statusText}`);
        }
        console.log('Telemetry sent to ThingsBoard successfully.');
        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Error in ThingsboardIntegration handler:', error instanceof Error ? error.message : error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
