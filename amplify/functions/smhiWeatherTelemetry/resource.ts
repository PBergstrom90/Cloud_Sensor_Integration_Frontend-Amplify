import { defineFunction, secret } from '@aws-amplify/backend';

export const smhiWeatherTelemetry = defineFunction({

  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'),
    API_PROJECT_WEATHERSTATION_TABLENAME: secret('WEATHER_STATION_TABLENAME')
  },
  // optionally specify a name for the Function (defaults to directory name)
  name: 'smhiWeatherTelemetry',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});