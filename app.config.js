import "dotenv/config";

export default ({ config }) => ({
  ...config,
  owner: "yognik",
  android: {
    ...config.android,
    package: "com.yognik.escape",
  },
  extra: {
    ...config.extra,
    API_BASE_URL: process.env.API_BASE_URL,
    eas: {
      projectId: "6e019169-cd61-45c9-929d-b9a7846b84af",
    },
  },
  "plugins": [
    "expo-web-browser"
  ]
});
