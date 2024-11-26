import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import type { Handler } from "aws-lambda";

const SMHI_URL =
  "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/97200/period/latest-hour/data.json";
const dynamoDbClient = new DynamoDBClient({});
const TABLE_NAME = process.env.API_PROJECT_WEATHERSTATION_TABLENAME; // DynamoDB table name from Amplify

export const handler: Handler = async () => {
  try {
    // Fetch data from SMHI API
    const response = await fetch(SMHI_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch SMHI data: ${response.statusText}`);
    }
    const data = await response.json();

    // Extract relevant data
    const latestValue = data.value[data.value.length - 1]; // Latest observation
    const position = data.position[0]; // First position (assume it's consistent)
    const station = data.station;

    // Prepare data for DynamoDB
    const weatherData = {
      stationKey: { S: station.key }, // Partition key
      timestamp: { S: new Date(latestValue.date).toISOString() }, // Sort key
      temperature: { N: latestValue.value },
      quality: { S: latestValue.quality },
      latitude: { N: position.latitude.toString() },
      longitude: { N: position.longitude.toString() },
      height: { N: position.height.toString() },
      stationName: { S: station.name },
    };

    // Save to DynamoDB
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: weatherData,
    });
    await dynamoDbClient.send(putCommand);
    console.log("Weather station data saved successfully:", weatherData);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Weather station data saved successfully" }),
    };
  } catch (error) {
    console.error("Error fetching or saving SMHI data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as any).message }),
    };
  }
};
