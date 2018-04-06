import * as bodyParser from "body-parser";
import { createHmac } from "crypto";
import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as HttpStatus from "http-status-codes";
import * as https from "https";
import * as querystring from "querystring";
import * as uuid from "uuid";
import { Api } from "../src";

// invoice state
enum InvoiceState {
  // invoice has been created but no payment updates have been received
  PENDING = "PENDING",

  // invoice has been paid but not yet confirmed, waiting for required confirmations
  // note that it may have been under- or overpaid, check the amounts
  PAID = "PAID",

  // invoice has been paid and received sufficient confirmations
  // note that it may have been under- or overpaid, check the amounts
  CONFIRMED = "CONFIRMED",

  // x EXPIRED
  // x PAID_EXPIRED

  // TODO: handle expiry?
  // x PAID_EXPIRED = "PAID_EXPIRED",
  // x EXPIRED = "EXPIRED",
  // x CANCELLED = "CANCELLED",
  // x FAILED = "FAILED",
}

// TODO: refactor as class
interface IInvoice {
  id: string;
  amountDue: number;
  amountPaid: number;
  message: string;
  confirmations: number;
  state: InvoiceState;
  address?: string;
  transactionHash?: string;
  // TODO: created, updated, paid date
  // TODO: expiry date?
  // TODO: state transitions
}

interface IInvoiceSignatureInfo {
  id: string;
  amountDue: number;
  message: string;
}

interface IArrayMap<T> {
  [x: string]: T[] | undefined;
}

// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();

// constants
const HTTP_PORT = 80;
const DEFAULT_PORT = 3000;
const BITCOIN_TO_SATOSHI = 100000000;
const OK_RESPONSE = "*";

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
const invoices: IInvoice[] = [];

// initiate api
const api = new Api(config.api);

// create the express server application
const app = express();

// parse application/x-www-form-urlencoded and  application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// handle index view request
app.get("/", async (_request, response, _next) => {
  // show request payment form
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
  // extract amount and message from the request payment form
  const { amount, message } = request.body;

  // create an invoice
  const id = uuid.v4();
  const invoice: IInvoice = {
    id,
    amountDue: bitcoinToSatoshi(amount),
    amountPaid: 0,
    message,
    confirmations: 0,
    state: InvoiceState.PENDING,
  };

  // store the invoice in memory (this would really be a database)
  invoices.push(invoice);

  // build invoice signature to later verify that the handle payment request is valid
  const signature = getInvoiceSignature(invoice, config.app.secret);

  // build the callback url, containing invoice info signed with the secret
  const callbackUrl = getAbsoluteUrl(`/handle-payment?${querystring.stringify({ signature })}`);

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
    amount: satoshiToBitcoin(invoice.amountDue),
    message: invoice.message,
  };
  const qrCodeUrl = getAbsoluteUrl(`/qr?${querystring.stringify(qrCodeParameters)}`);

  // show payment request info along with the qr code to scan
  response.send(`
    <h1>Invoice</h1>

    <ul>
      <li><strong>Address:</strong> ${invoice.address}</li>
      <li><strong>Amount paid:</strong> ${satoshiToBitcoin(invoice.amountPaid)}/${satoshiToBitcoin(
    invoice.amountDue,
  )} BTC</li>
      <li><strong>Message:</strong> ${invoice.message}</li>
      <li><strong>Confirmations:</strong> ${invoice.confirmations}</li>
      <li><strong>State:</strong> ${invoice.state}</li>
    </ul>

    <p>
      <img src="${qrCodeUrl}"/>
    </p>

    <p>
      <a href="${getAbsoluteUrl(`/invoice/${invoiceId}`)}">Refresh this page</a> to check for updates.
    </p>
  `);
});

// handle qr image request
app.get("/qr", async (request, response, _next) => {
  const { address, amount, message } = request.query;

  const paymentRequestQrCode = Api.getPaymentRequestQrCode(address, amount, message);

  response.setHeader("Content-Type", "image/png");
  paymentRequestQrCode.pipe(response);
});

// handle payment update request
app.get("/handle-payment", async (request, response, _next) => {
  const { signature, address, transaction_hash: transactionHash, value, confirmations } = request.query;
  const invoice = invoices.find(item => item.address === address);

  // give up if an invoice with given address could not be found
  if (!invoice) {
    console.log(
      {
        query: request.query,
      },
      "invoice could not be found",
    );

    // still send the OK response as we don't want any more updates on this invoice
    response.send(OK_RESPONSE);

    return;
  }

  // calculate expected signature
  const expectedSignature = getInvoiceSignature(invoice, config.app.secret);

  // validate payment update
  const isSignatureValid = signature === expectedSignature;
  const isAddressValid = invoice.address === address;
  const isHashValid = true; // TODO: actually validate hash
  const isUpdateValid = isSignatureValid && isAddressValid && isHashValid;

  // respond with bad request if update was not valid
  if (!isUpdateValid) {
    // log failing update info
    console.warn(
      {
        query: request.query,
        info: { signature, address, transactionHash, value, confirmations },
        invoice,
        isSignatureValid,
        isAddressValid,
        isHashValid,
        isUpdateValid,
      },
      "got invalid payment update",
    );

    // respond with bad request
    response.status(HttpStatus.BAD_REQUEST).send("got invalid payment status update");

    return;
  }

  // update is valid, update invoice info
  invoice.confirmations = parseInt(confirmations, 10);
  invoice.amountPaid = parseInt(value, 10);
  invoice.transactionHash = transactionHash;

  // remember previous state and resolve new state
  const previousState = invoice.state;
  let newState = invoice.state;

  // check for valid initial states
  if ([InvoiceState.PENDING, InvoiceState.PAID].indexOf(previousState) !== -1) {
    const hasSufficientConfirmations = invoice.confirmations >= config.app.requiredConfirmations;

    newState = hasSufficientConfirmations ? InvoiceState.CONFIRMED : InvoiceState.PAID;
  }

  // make sure the state transitions is valid
  if (isValidStateTransition(previousState, newState)) {
    invoice.state = newState;
  } else {
    console.warn(
      {
        previousState,
        newState,
      },
      "resolved to invalid invoice state",
    );
  }

  // check whether invoice was just paid
  if (previousState !== InvoiceState.CONFIRMED && newState === InvoiceState.CONFIRMED) {
    // ship out the products etc..
    // TODO: call some handler
    console.log(invoice, "invoice is now paid");
  }

  // check whether handling given invoice is complete and respond accordingly
  const isComplete = isFinalState(invoice.state);
  const responseText = isComplete ? OK_RESPONSE : invoice.state;

  // log the request info
  console.log(
    {
      query: request.query,
      info: { signature, address, transactionHash, value, confirmations },
      invoice,
      isSignatureValid,
      isAddressValid,
      isHashValid,
      isUpdateValid,
      isComplete,
    },
    "got valid payment update",
  );

  // respond with *ok* if we have reached a final state (will not get new updates after this)
  response.send(responseText);
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

function getInvoiceSignature(invoice: IInvoiceSignatureInfo, key: string) {
  const tokens = [invoice.id, invoice.amountDue.toString(), invoice.message];
  const payload = tokens.join(":");

  return createHmac("sha512", key)
    .update(payload)
    .digest("hex");
}

function satoshiToBitcoin(microValue: number): number {
  return microValue / BITCOIN_TO_SATOSHI;
}

function bitcoinToSatoshi(floatValue: number): number {
  return Math.floor(floatValue * BITCOIN_TO_SATOSHI);
}

function isValidStateTransition(currentState: InvoiceState, newState: InvoiceState): boolean {
  // allow not changing the state
  if (currentState === newState) {
    return true;
  }

  // map of current to possible new states
  const validTransitionsMap: IArrayMap<InvoiceState> = {
    [InvoiceState.PENDING]: [InvoiceState.PAID, InvoiceState.CONFIRMED],
    [InvoiceState.PAID]: [InvoiceState.CONFIRMED],
    [InvoiceState.CONFIRMED]: [],
  };

  // valid transitions for current state
  const validTransitions = validTransitionsMap[currentState];

  // throw error if mapping is missing for some reason
  /* istanbul ignore if */
  if (!validTransitions) {
    throw new Error(`Valid state transitions mapping for "${currentState}" is missing, this should not happen`);
  }

  // transition is valid if the new state is in the valid transitions list
  return validTransitions.indexOf(newState) !== -1;
}

function isFinalState(state: InvoiceState) {
  const finalStates: InvoiceState[] = [InvoiceState.CONFIRMED];

  return finalStates.indexOf(state) !== -1;
}
