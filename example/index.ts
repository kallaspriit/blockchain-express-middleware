import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as querystring from "querystring";
import { Api } from "../src";

// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();

// constants
const HTTP_PORT = 80;
const DEFAULT_PORT = 3000;

// extract configuration from the .env environment variables
const config = {
  server: {
    host: process.env.SERVER_HOST !== undefined ? process.env.SERVER_HOST : "localhost",
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

// parse application/x-www-form-urlencoded and  application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// handle index view request
app.get("/", async (_request, response, _next) => {
  response.send(`
    <h1>Request Bitcoin payment</h1>

    <form method="post" action="/pay">
      <p>
        <input type="text" name="amount" value="0.0001" /> Amount (BTC)
      </p>
      <p>
        <input type="text" name="message" value="Test payment" /> Message
      </p>
      <p>
        <input type="submit" name="submit" value="Request payment" />
      </p>
    </form>
  `);
});

// handle payment form request
app.post("/pay", async (request, response, next) => {
  const { amount, message } = request.body;
  const callbackUrl = getAbsoluteUrl("/handle-payment");

  try {
    const paymentRequest = await api.generateReceivingAddress(callbackUrl);
    const qrCodeParameters = { address: paymentRequest.address, amount, message };
    const qrCodeUrl = getAbsoluteUrl(`/qr?${querystring.stringify(qrCodeParameters)}`);

    response.send(`
      <h1>Payment request</h1>

      <ul>
        <li><strong>Address:</strong> ${paymentRequest.address}</li>
        <li><strong>Amount:</strong> ${amount}</li>
        <li><strong>Message:</strong> ${message}</li>
      </ul>

      <img src="${qrCodeUrl}"/>
    `);
  } catch (error) {
    next(error);
  }
});

// handle qr image request
app.get("/qr", async (request, response, _next) => {
  const { address, amount, message } = request.query;

  const paymentRequestQrCode = Api.getPaymentRequestQrCode(address, amount, message);

  response.setHeader("Content-Type", "image/png");
  paymentRequestQrCode.pipe(response);
});

// handle payment update request
app.use("/handle-payment", async (request, response, _next) => {
  console.log(
    {
      method: request.method,
      query: request.query,
      body: request.body,
    },
    "got handle payment update",
  );

  response.send("pending");
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
server.listen(
  {
    host: "0.0.0.0",
    port: config.server.port,
  },
  () => {
    console.log(`server started on port ${config.server.port}`);
  },
);

// also start a http server to redirect to https if ssl is enabled
if (config.server.useSSL) {
  express()
    .use((request, response, _next) => {
      response.redirect(`https://${request.hostname}${request.originalUrl}`);
    })
    .listen(HTTP_PORT);
}

function getAbsoluteUrl(path: string) {
  const port = config.server.port === HTTP_PORT ? "" : `:${config.server.port}`;
  const url = `${config.server.host}${port}${path}`.replace(/\/{2,}/g, "/");

  return `${config.server.useSSL ? "https" : "http"}://${url}`;
}
