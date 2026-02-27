import Whop from "@whop/sdk";

export const whopApi = new Whop({
  token: process.env.WHOP_API_KEY,
});
