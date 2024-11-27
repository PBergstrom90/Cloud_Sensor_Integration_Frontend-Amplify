import { defineFunction, secret } from '@aws-amplify/backend';
export const smhiWeatherTelemetry = defineFunction({
  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'),
    API_KEY: secret('CUSTOM_LAMBDA_GRAPHQL_KEY'),
    API_PROJECT_WEATHERSTATION_TABLENAME: secret('WEATHER_STATION_TABLENAME')
  },
  name: 'smhiWeatherTelemetry',
  entry: './handler.ts',
});