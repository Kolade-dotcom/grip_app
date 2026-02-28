import Whop from "@whop/sdk";

export const whopApi = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.WHOP_APP_ID,
});
