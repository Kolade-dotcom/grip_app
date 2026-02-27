import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "grip",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
