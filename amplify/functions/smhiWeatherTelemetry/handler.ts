import { Handler } from "aws-lambda";

const SMHI_URL_BROMMA = "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/97200/period/latest-hour/data.json";
const SMHI_URL_STOCKHOLM = "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/98230/period/latest-hour/data.json";
const SMHI_URL_GOTEBORG = "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/71420/period/latest-hour/data.json";
const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

// Map station keys to URLs
const stationUrls: Record<string, string> = {
  "97200": SMHI_URL_BROMMA,
  "98230": SMHI_URL_STOCKHOLM,
  "71420": SMHI_URL_GOTEBORG,
};

export const handler: Handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "x-api-key,Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
  };

  // Handle CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify([{ statusCode: 200, message: "CORS preflight response" }]),
    };
  }

  const headers = {
    "x-api-key": GRAPHQL_API_KEY,
    "Content-Type": "application/json",
  };

  let statusCode = 200;
  let responseBody: Array<Record<string, any>> = [];

  try {
    // Parse stationKey from the request body
    const { stationKey } = JSON.parse(event.body || "{}");

    // Validate stationKey and get the corresponding URL
    const smhiUrl = stationUrls[stationKey];
    if (!stationKey || !smhiUrl) {
      throw new Error(`Invalid or missing stationKey: ${stationKey}`);
    }
    console.log(`Received stationKey: ${stationKey}, SMHI URL: ${smhiUrl}`);

    // Step 1: Fetch SMHI data
    console.log("Fetching data from SMHI API...");
    const smhiResponse = await fetch(smhiUrl);
    if (!smhiResponse.ok) {
      throw new Error(`Failed to fetch SMHI data: ${smhiResponse.statusText}`);
    }
    const smhiData = await smhiResponse.json();
    const latestValue = smhiData.value[smhiData.value.length - 1];
    const position = smhiData.position[0];
    const unixTimestamp = Math.floor(latestValue.date / 1000);
    console.log("Fetched data from SMHI API:", {
      stationKey,
      timestamp: unixTimestamp,
      temperature: latestValue.value,
    });

    // Step 2: Check if data already exists
    console.log("Checking for existing data...");
    const existingData = await checkExistingData(stationKey, unixTimestamp);
    if (existingData) {
      console.log("Data already exists for this station and timestamp:", existingData);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify([{ statusCode: 200, message: "Data already exists", data: [] }]),
      };
    }

    // Step 3: Get owner of the weather station
    console.log("Fetching weather station owner...");
    const stationQuery = `
      query stationQuery {
        getWeatherStation(stationKey: "${stationKey}") {
          stationKey
          owner
        }
      }
    `;
    const stationResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: stationQuery }),
    });

    const stationResponseBody = await stationResponse.json();
    if (stationResponseBody.errors || !stationResponseBody.data?.getWeatherStation) {
      throw new Error("Weather station not found or query failed.");
    }
    const owner = stationResponseBody.data.getWeatherStation.owner;
    console.log(`Found weather station owner: ${owner}`);

    // Step 4: Add new weather data
    console.log("Preparing GraphQL mutation to add weather data...");
    const mutation = `
      mutation AddWeatherData {
        createWeatherData(input: {
          stationKey: "${stationKey}",
          timestamp: ${unixTimestamp},
          temperature: ${latestValue.value},
          quality: "${latestValue.quality}",
          latitude: ${position.latitude},
          longitude: ${position.longitude},
          height: ${position.height},
          stationName: "${smhiData.station.name}",
          owner: "${owner}"
        }) {
          stationKey
          timestamp
          temperature
        }
      }
    `;
    const graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: mutation }),
    });
    const graphqlData = await graphqlResponse.json();
    if (graphqlData.errors) {
      throw new Error(`GraphQL mutation failed: ${JSON.stringify(graphqlData.errors)}`);
    }
    console.log("Weather station data saved successfully:", graphqlData.data);

    // Wrap success data in an array with status code
    responseBody = [
      {
        statusCode: 201,
        message: "Weather data saved successfully",
        data: graphqlData.data.createWeatherData,
      },
    ];
  } catch (error) {
    console.error("Error in Lambda function:", error);
    statusCode = 500;
    responseBody = [
      {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        stack: error instanceof Error ? error.stack : undefined,
      },
    ];
  }
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(responseBody),
  };
};
const checkExistingData = async (stationKey: string, timestamp: number) => {
  console.log(`Checking if data exists for stationKey: ${stationKey}, timestamp: ${timestamp}`);
  const query = `
    query CheckWeatherData {
      getWeatherData(stationKey: "${stationKey}", timestamp: ${timestamp}) {
        stationKey
        timestamp
      }
    }
  `;
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": GRAPHQL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  if (data.errors) {
    console.error("Error checking existing data:", data.errors);
    throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
  }
  return data.data?.getWeatherData || null;
};
