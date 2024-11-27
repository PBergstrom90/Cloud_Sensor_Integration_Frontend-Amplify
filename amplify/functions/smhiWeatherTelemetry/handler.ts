import type { Handler } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

export const handler: Handler = async (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  let statusCode = 200;
  let response;
  let responseBody;
  let request;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  const headers = {
    'x-api-key': GRAPHQL_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    // Step 1: Get owner information based on stationKey
    console.log("Fetching owner information...");
    request = new Request(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `query GetStationOwner {
          getWeatherStationData(stationKey: "${event.stationKey}", timestamp: ${event.timestamp}) {
            stationKey
            owner
          }
        }`,
      }),
    });

    response = await fetch(request);
    responseBody = await response.json();
    console.log("Owner fetch response:", responseBody);

    if (!responseBody.data.getWeatherStationData?.owner) {
      throw new Error("Owner not found for the given stationKey");
    }

    const owner = responseBody.data.getWeatherStationData.owner;

    // Step 2: Mutate to create new weatherStationData
    console.log("Creating new weatherStationData...");
    request = new Request(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `mutation CreateWeatherStationData {
          createWeatherStationData(input: {
            stationKey: "${event.stationKey}",
            timestamp: ${event.timestamp},
            temperature: ${event.temperature},
            quality: "${event.quality}",
            latitude: ${event.latitude},
            longitude: ${event.longitude},
            height: ${event.height},
            stationName: "${event.stationName}",
            owner: "${owner}"
          }) {
            stationKey
            timestamp
            temperature
            owner
          }
        }`,
      }),
    });

    response = await fetch(request);
    responseBody = await response.json();
    console.log("Mutation response:", responseBody);

    if (responseBody.errors) {
      throw new Error(`Mutation errors: ${JSON.stringify(responseBody.errors)}`);
    }
  } catch (error) {
    statusCode = 500;
    responseBody = {
      errors: [
        {
          message: (error as Error)?.message || "Unknown error",
          stack: (error as Error)?.stack,
        },
      ],
    };
    console.error("Error in handler:", error);
  }

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(responseBody),
  };
};