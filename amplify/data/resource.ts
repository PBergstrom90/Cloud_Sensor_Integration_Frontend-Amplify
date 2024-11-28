import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";

const schema = a.schema({
  telemetry: a
    .model({
      device_id: a.string().required(),
      timestamp: a.timestamp().required(),
      temperature: a.float(),
      humidity: a.float(),
      owner: a.string().required()
    })
    .identifier(['device_id', 'timestamp'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

  devices: a
    .model({
      device_id: a.string().required(),
      owner: a.string().required(),
      status: a.string(),
    })
    .identifier(['device_id'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

    weatherStation: a
      .model({
        stationKey: a.string().required(), // Partition key
        owner: a.string().required(), // Session owner
      })
      .identifier(['stationKey'])
      .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

    weatherData: a
    .model({
      stationKey: a.string().required(), // Partition key
      timestamp: a.timestamp().required(), // Sort key
      temperature: a.float(), // Temperature value
      quality: a.string(), // Quality of data (e.g., "G")
      latitude: a.float(), // GPS Latitude
      longitude: a.float(), // GPS Longitude
      height: a.float(), // Measurement height
      stationName: a.string(), // Station name
      owner: a.string().required(), // Session owner
    })
    .identifier(['stationKey', 'timestamp'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});