// twilioClient.js
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error("Twilio SID or Auth Token is missing in .env");
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default client;
