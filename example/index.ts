import * as dotenv from "dotenv";
import { Api } from "../src";

// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();

// extract configuration from the .env environment variables
const config = {
  apiKey: process.env.API_KEY !== undefined ? process.env.API_KEY : "",
  xPub: process.env.XPUB !== undefined ? process.env.XPUB : "",
};

// run the example application (IIFE needed to use async)
(async () => {
  const api = new Api(config);

  const callbackUrl = "https://example.com/handle-payment";
  const receivingAddress = await api.generateReceivingAddress(callbackUrl);

  console.log(receivingAddress);
})().catch(error => console.error(error));
