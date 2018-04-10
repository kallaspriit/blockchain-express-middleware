import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as HttpStatus from "http-status-codes";
import * as https from "https";
import * as querystring from "querystring";
import * as uuid from "uuid";
import blockchainMiddleware, { Api, Invoice } from "../src";

// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();

// constants
const HTTP_PORT = 80;
const DEFAULT_PORT = 3000;

// extract configuration from the .env environment variables
const config = {
  server: {
    host: process.env.SERVER_HOST !== undefined ? process.env.SERVER_HOST : "localhost",
    port: process.env.SERVER_PORT !== undefined ? parseInt(process.env.SERVER_PORT, 10) : DEFAULT_PORT,
    useSSL: process.env.SERVER_USE_SSL === "true",
    cert: process.env.SERVER_CERT !== undefined ? process.env.SERVER_CERT : "",
    key: process.env.SERVER_KEY !== undefined ? process.env.SERVER_KEY : "",
  },
  api: {
    apiKey: process.env.API_KEY !== undefined ? process.env.API_KEY : "",
    xPub: process.env.API_XPUB !== undefined ? process.env.API_XPUB : "",
  },
  app: {
    secret: process.env.APP_SECRET !== undefined ? process.env.APP_SECRET : "",
    requiredConfirmations:
      process.env.APP_REQUIRED_CONFIRMATIONS !== undefined ? parseInt(process.env.APP_REQUIRED_CONFIRMATIONS, 10) : 1,
  },
};

// invoices "database"
const invoices: Invoice[] = [];

// initiate api
const api = new Api(config.api);

// create the express server application
const app = express();

// parse application/x-www-form-urlencoded and  application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use the blockchain middleware
app.use(
  "/payment",
  blockchainMiddleware({
    secret: config.app.secret,
    requiredConfirmations: config.app.requiredConfirmations,
    // saveInvoice: async invoice => {
    //   invoices.push(invoice);
    // },
    loadInvoice: async address => invoices.find(item => item.address === address),
  }),
);

// handle index view request
app.get("/", async (_request, response, _next) => {
  // show request payment form
  response.send(`
    <h1>Bitcoin gateway</h1>

    <h2>Request Bitcoin payment</h2>
    <form method="post" action="/pay">
      <p>
        <input type="text" name="dueAmount" value="0.0001" /> Amount (BTC)
      </p>
      <p>
        <input type="text" name="message" value="Test payment" /> Message
      </p>
      <p>
        <input type="submit" name="submit" value="Request payment" />
      </p>
    </form>

    <h2>Bitcoin payments</h2>
    <ul>
      ${invoices.map(
        invoice => `
        <li>
          <a href="/invoice/${invoice.id}">${invoice.message}</a>
          <ul>
            <li><strong>Address:</strong> ${invoice.address}</li>
            <li><strong>Amount paid:</strong> ${Api.satoshiToBitcoin(invoice.getPaidAmount())}/${Api.satoshiToBitcoin(
          invoice.dueAmount,
        )} BTC (${invoice.getAmountState()})</li>
            <li><strong>State:</strong> ${invoice.getPaymentState()} (${invoice.getConfirmationCount()}/${
          config.app.requiredConfirmations
        })</li>
          </ul>
        </li>
      `,
      )}
    </ul>
  `);
});

// handle payment form request
app.post("/pay", async (request, response, next) => {
  // extract amount and message from the request payment form
  const { dueAmount, message } = request.body;

  // create an invoice
  const id = uuid.v4();
  const invoice = new Invoice({
    id,
    dueAmount: Api.bitcoinToSatoshi(dueAmount),
    message,
  });

  // store the invoice in memory (this would really be a database)
  invoices.push(invoice);

  // build invoice signature to later verify that the handle payment request is valid
  const signature = invoice.getSignature(config.app.secret);

  // build the callback url, containing invoice info signed with the secret
  const callbackUrl = getAbsoluteUrl(`/payment/handle-payment?${querystring.stringify({ signature })}`);

  try {
    // generate next receiving address
    const receivingAddress = await api.generateReceivingAddress(callbackUrl);

    // update invoice address
    invoice.address = receivingAddress.address;

    // redirect user to invoice view
    response.redirect(`/invoice/${invoice.id}`);
  } catch (error) {
    next(error);
  }
});

// handle invoice request
app.get("/invoice/:invoiceId", async (request, response, _next) => {
  const { invoiceId } = request.params;
  const invoice = invoices.find(item => item.id === invoiceId);

  if (!invoice) {
    response.status(HttpStatus.NOT_FOUND).send("Invoice could not be found");

    return;
  }

  // build qr code url
  const qrCodeParameters = {
    address: invoice.address,
    amount: Api.satoshiToBitcoin(invoice.dueAmount),
    message: invoice.message,
  };
  const qrCodeUrl = getAbsoluteUrl(`/payment/qr?${querystring.stringify(qrCodeParameters)}`);

  // show payment request info along with the qr code to scan
  response.send(`
    <h1>Invoice</h1>

    <ul>
      <li><strong>Address:</strong> ${invoice.address}</li>
      <li><strong>Amount paid:</strong> ${Api.satoshiToBitcoin(invoice.getPaidAmount())}/${Api.satoshiToBitcoin(
    invoice.dueAmount,
  )} BTC (${invoice.getAmountState()})</li>
      <li><strong>Message:</strong> ${invoice.message}</li>
      <li><strong>Confirmations:</strong> ${invoice.getConfirmationCount()}/${config.app.requiredConfirmations}</li>
      <li><strong>State:</strong> ${invoice.getPaymentState()}</li>
      <li><strong>Is complete:</strong> ${invoice.isComplete() ? "yes" : "no"}</li>
      <li><strong>Created:</strong> ${invoice.createdDate.toISOString()}</li>
      <li><strong>Updated:</strong> ${invoice.updatedDate.toISOString()}</li>
      <li>
        <strong>Transactions:</strong>
        <ul>
          ${invoice.transactions.map(
            (transaction, index) => `
              <li>
                <strong>Transaction #${index + 1}</strong>
                <ul>
                  <li><strong>Hash:</strong> ${transaction.hash}</li>
                  <li><strong>Amount:</strong> ${Api.satoshiToBitcoin(transaction.amount)} BTC</li>
                  <li><strong>Confirmations:</strong> ${transaction.confirmations}/${
              config.app.requiredConfirmations
            }</li>
                  <li><strong>Created:</strong> ${transaction.createdDate.toISOString()}</li>
                  <li><strong>Updated:</strong> ${transaction.updatedDate.toISOString()}</li>
                </ul>
              </li>
          `,
          )}
        </ul>
      </li>
    </ul>

    <p>
      <img src="${qrCodeUrl}"/>
    </p>

    <p>
      <a href="${getAbsoluteUrl(`/invoice/${invoiceId}`)}">Refresh this page</a> to check for updates.
    </p>
  `);
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
