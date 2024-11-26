import { defineFunction, secret } from '@aws-amplify/backend';

export const thingsboardIntegration = defineFunction({

  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'), // this assumes you created a secret named "MY_API_KEY"
    THINGSBOARD_API_KEY: secret('THINGSBOARD_LAMBDA_GRAPHQL_KEY'), // this assumes you created a secret named "MY_API_KEY"
    THINGSBOARD_ACCESS_TOKEN: secret('THINGSBOARD_ACCESS_TOKEN')
},
  // optionally specify a name for the Function (defaults to directory name)
  name: 'thingsboardIntegration',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});