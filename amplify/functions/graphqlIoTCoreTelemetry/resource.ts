import { defineFunction, secret } from '@aws-amplify/backend';
export const graphqlIoTCoreTelemetry = defineFunction({
  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'),
    API_KEY: secret('CUSTOM_LAMBDA_GRAPHQL_KEY')
  },
  name: 'graphqlIoTCoreTelemetry',
  entry: './handler.ts'
});