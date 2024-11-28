import { Handler } from "aws-lambda";

const SMHI_URL =
  "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/97200/period/latest-hour/data.json";
const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

export const handler: Handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  let statusCode = 200;
  let responseBody;
  let response;
  let request;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "x-api-key,Content-Type",
    "Access-Control-Allow-Methods": "*",
  }

  const headers = {
    "x-api-key": GRAPHQL_API_KEY,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Fetch SMHI data
    console.log("Fetching data from SMHI API...");
    const smhiResponse = await fetch(SMHI_URL);
    if (!smhiResponse.ok) {
      throw new Error(`Failed to fetch SMHI data: ${smhiResponse.statusText}`);
    }
    const smhiData = await smhiResponse.json();

    // Extract relevant data
    const latestValue = smhiData.value[smhiData.value.length - 1];
    const position = smhiData.position[0];
    const station = smhiData.station;
    const unixTimestamp = Math.floor(latestValue.date / 1000);

    console.log("Fetched data from SMHI API:", {
      stationKey: station.key,
      timestamp: latestValue.date,
      temperature: latestValue.value,
    });

    // Step 2: Check if data already exists
    console.log("Checking for existing data...");
    const existingData = await checkExistingData(station.key, unixTimestamp);
    if (existingData) {
      console.log("Data already exists for this station and timestamp:", existingData);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Data already exists" }),
      };
    }

          // Get sessionowner of the weather station
          request = new Request(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: `query stationQuery {
                        getWeatherStation(stationKey: "${event.stationKey}") {
                        stationKey
                        owner
                        }
                      }
                    `})
        });
        console.log("request:", request)
    
        try {
            response = await fetch(request);
            responseBody = await response.json();
            console.log("responseBody:", responseBody)
            if (responseBody.errors) statusCode = 400;
            if (!responseBody.data.getWeatherStation) {
              return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Weather station not found" }),
              };
            }  
            } catch (error) {
            statusCode = 400;
            responseBody = {
                errors: [
                    {
                        status: response?.status,
                        error: JSON.stringify(error),
                    }
                ]
            };
        }

    const owner = responseBody.data.getStation.owner;

    // Step 3: Prepare GraphQL mutation
    const mutation = `
      mutation AddWeatherData {
        createWeatherData(input: {
          stationKey: "${station.key}",
          timestamp: ${unixTimestamp},
          temperature: ${latestValue.value},
          quality: "${latestValue.quality}",
          latitude: ${position.latitude},
          longitude: ${position.longitude},
          height: ${position.height},
          stationName: "${station.name}"
          owner: "${owner}"
        }) {
          stationKey
          timestamp
          temperature
        }
      }
    `;
    console.log("Prepared GraphQL mutation:", mutation);

    // Step 4: Send GraphQL mutation
    const graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: mutation }),
    });

    const graphqlData = await graphqlResponse.json();
    if (graphqlData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(graphqlData.errors)}`);
    }

    console.log("Weather station data saved successfully:", graphqlData.data);
    responseBody = graphqlData.data;
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
    headers: corsHeaders,
    body: JSON.stringify(responseBody),
  };
};

const checkExistingData = async (stationKey: string, timestamp: number) => {
  const query = `
    query CheckWeatherData {
      getWeatherStationData(stationKey: "${stationKey}", timestamp: ${timestamp}) {
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
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data?.getWeatherStationData || null;
};