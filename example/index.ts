import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import { Api } from "../src";

// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();

// constants
const HTTP_PORT = 80;
const DEFAULT_PORT = 3000;

// extract configuration from the .env environment variables
const config = {
  server: {
    port: process.env.SERVER_PORT !== undefined ? process.env.SERVER_PORT : DEFAULT_PORT,
    useSSL: process.env.SERVER_USE_SSL === "true",
    cert: process.env.SERVER_CERT !== undefined ? process.env.SERVER_CERT : "",
    key: process.env.SERVER_KEY !== undefined ? process.env.SERVER_KEY : "",
  },
  api: {
    apiKey: process.env.API_KEY !== undefined ? process.env.API_KEY : "",
    xPub: process.env.API_XPUB !== undefined ? process.env.API_XPUB : "",
  },
};

// initiate api
const api = new Api(config.api);

// create the express server application
const app = express();

// handle index view request
app.get("/", async (_request, response, _next) => {
  const callbackUrl = "https://example.com/handle-payment";
  const receivingAddress = await api.generateReceivingAddress(callbackUrl);

  response.send(receivingAddress);
});

// create either http or https server depending on SSL configuration
const server = config.server.useSSL
  ? https.createServer(
      {
        cert: fs.readFileSync(config.server.cert),
        key: fs.readFileSync(config.server.key),
      },
      app,
    )
  : http.createServer(app);

// start the server
server.listen(config.server.port, () => {
  console.log(`server started on port ${config.server.port}`);
});

// also start a http server to redirect to https if ssl is enabled
if (config.server.useSSL) {
  express()
    .use((request, response, _next) => {
      response.redirect(`https://${request.hostname}${request.originalUrl}`);
    })
    .listen(HTTP_PORT);
}
