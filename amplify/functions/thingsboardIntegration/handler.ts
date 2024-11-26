import axios from 'axios';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.THINGSBOARD_API_KEY as string;
const ACCESS_TOKEN = process.env.THINGSBOARD_ACCESS_TOKEN as string;
const THINGSBOARD_TELEMETRY_URL = `http://localhost:8080/api/v1/${ACCESS_TOKEN}/telemetry`;

export const handler = async (event: any) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json',
    };

    try {
        // Step 1: Fetch metadata from AppSync
        const deviceQuery = await axios.post(
            GRAPHQL_ENDPOINT,
            {
                query: `query GetDevice {
                    getDevices(device_id: "${event.device_id}") {
                        device_id
                        owner
                    }
                }`,
            },
            { headers }
        );
        const deviceData = deviceQuery.data?.data?.getDevices;
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
                owner: deviceData.owner, // Enrich telemetry with owner metadata
            },
        };
        console.log('Telemetry payload for ThingsBoard:', telemetryPayload);

        // Step 3: Push telemetry to ThingsBoard
        const thingsboardResponse = await axios.post(THINGSBOARD_TELEMETRY_URL, telemetryPayload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('Telemetry sent to ThingsBoard successfully:', thingsboardResponse.data);
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
