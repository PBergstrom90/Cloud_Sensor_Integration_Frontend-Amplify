import type { Handler } from "aws-lambda";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const SMHI_URL =
  "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/97200/period/latest-hour/data.json";
const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: APIGatewayProxyHandlerV2 = async () => {
  console.log("Starting SMHI Weather Telemetry function...");

  let statusCode = 200;
  let response;
  let responseBody;

  const headers = {
    "Access-Control-Allow-Headers": "x-api-key,Content-Type",
    "x-api-key": GRAPHQL_API_KEY,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Fetch SMHI data
    console.log("Fetching data from SMHI API...");
    response = await fetch(SMHI_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch SMHI data: ${response.statusText}`);
    }
    const smhiData = await response.json();

    // Extract relevant data
    const latestValue = smhiData.value[smhiData.value.length - 1];
    const position = smhiData.position[0];
    const station = smhiData.station;

    console.log("Fetched data from SMHI API:", {
      stationKey: station.key,
      timestamp: latestValue.date,
      temperature: latestValue.value,
    });

    // Step 2: Prepare GraphQL mutation
    const mutation = `
      mutation AddWeatherStationData {
        createWeatherStationData(input: {
          stationKey: "${station.key}",
          timestamp: "${latestValue.date},",
          temperature: ${latestValue.value},
          quality: "${latestValue.quality}",
          latitude: ${position.latitude},
          longitude: ${position.longitude},
          height: ${position.height},
          stationName: "${station.name}"
        }) {
          stationKey
          timestamp
          temperature
        }
      }
    `;
    console.log("Prepared GraphQL mutation:", mutation);

    // Step 3: Send GraphQL mutation
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: mutation }),
    });

    responseBody = await response.json();
    if (responseBody.errors) {
      statusCode = 400;
      console.error("GraphQL mutation errors:", responseBody.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(responseBody.errors)}`);
    }

    console.log("Weather station data saved successfully:", responseBody.data);
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
    console.error("Error in smhiWeatherTelemetry function:", error);
  }

  return {
    statusCode,
    body: JSON.stringify(responseBody),
  };
};
