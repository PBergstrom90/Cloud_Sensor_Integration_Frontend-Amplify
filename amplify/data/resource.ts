import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

const echoHandler = defineFunction({
  entry: './echo-handler/handler.ts'
})

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

  addTelemetry: a
    .mutation()
    .arguments({
      device_id: a.string().required(),
      timestamp: a.timestamp().required(),
      temperature: a.float(),
      humidity: a.float(),
      owner: a.string().required()
    }
    )
    .returns(a.ref("telemetry"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(echoHandler)),

  devices: a
    .model({
      device_id: a.string().required(),
      owner: a.string().required(),
      status: a.string(),
    })
    .identifier(['device_id'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

    weatherStationData: a
    .model({
      stationKey: a.string().required(), // Partition key
      timestamp: a.timestamp().required(), // Sort key
      temperature: a.float(), // Temperature value
      quality: a.string(), // Quality of data (e.g., "G")
      latitude: a.float(), // GPS Latitude
      longitude: a.float(), // GPS Longitude
      height: a.float(), // Measurement height
      stationName: a.string(), // Station name
    })
    .identifier(['stationKey', 'timestamp'])
    .authorization((allow) => [allow.publicApiKey()]),
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