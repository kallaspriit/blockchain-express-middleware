import * as bodyParser from "body-parser";
import * as express from "express";
import * as HttpStatus from "http-status-codes";
import * as querystring from "querystring";
import * as supertest from "supertest";
import blockchainMiddleware, { IInvoice, ILogger, Invoice } from "./";
import { processInvoiceForSnapshot } from "./Blockchain.test";

const SECRET = "zzz";
const RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";

// invoices "database" emulated with a simple array (store the data only)
const invoiceDatabase: IInvoice[] = [];

let server: supertest.SuperTest<supertest.Test>;

// tslint:disable:no-magic-numbers
describe("middleware", () => {
  beforeEach(() => {
    // create app
    const app = express();

    // parse application/x-www-form-urlencoded and  application/json
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // use the blockchain middleware
    app.use(
      "/payment",
      blockchainMiddleware({
        secret: SECRET,
        requiredConfirmations: 3,
        saveInvoice,
        loadInvoice,
      }),
    );

    server = supertest(app);
  });

  afterEach(() => {
    // "clear" the database
    while (invoiceDatabase.length > 0) {
      invoiceDatabase.pop();
    }
  });

  it("should provide qr code rendering", async () => {
    // build qr code url
    const qrCodeParameters = {
      address: RECEIVING_ADDRESS,
      amount: 1,
      message: "Test",
    };

    const response = await server.get(`/payment/qr?${querystring.stringify(qrCodeParameters)}`);

    expect(response.type).toEqual("image/png");
    expect(response.body).toMatchSnapshot();
  });

  // TODO: test invalid qr code parameters

  it("should handle valid payment updates", async () => {
    const invoice = new Invoice({
      dueAmount: 10,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoiceDatabase.push(invoice.toJSON());

    // no confirmations
    let parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 0,
    };

    const response1 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response1.status).toEqual(HttpStatus.OK);
    expect(response1.text).toMatchSnapshot();
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();

    // now has enough confirmations
    parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 5,
    };

    const response2 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response2.status).toEqual(HttpStatus.OK);
    expect(response2.text).toEqual("*ok*");
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();
  });

  it("should handle invalid invoice address", async () => {
    expect(invoiceDatabase.length).toEqual(0);

    const invoice = new Invoice({
      dueAmount: 10,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoiceDatabase.push(invoice.toJSON());

    // has invalid address
    const parameters = {
      signature: invoice.getSignature(SECRET),
      address: "foobar",
      transaction_hash: "xxx",
      value: 10,
      confirmations: 0,
    };

    const response = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.text).toEqual("*ok*");
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();
  });

  it("should ignore invalid update", async () => {
    const invoice = new Invoice({
      dueAmount: 10,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoiceDatabase.push(invoice.toJSON());

    // signature is made with an invalid secret
    const parameters = {
      signature: invoice.getSignature("foobar"),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 0,
    };

    const response = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.text).toMatchSnapshot();
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();
  });

  it("should fail if update tries to change amount", async () => {
    const invoice = new Invoice({
      dueAmount: 10,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoiceDatabase.push(invoice.toJSON());

    // has value of 10
    let parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 0,
    };

    const response1 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response1.status).toEqual(HttpStatus.OK);
    expect(response1.text).toMatchSnapshot();
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();

    // has new value of 100
    parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 100,
      confirmations: 5,
    };

    const response2 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response2.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(response2.text).toMatchSnapshot();
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();
  });

  it("should ignore updates once already complete", async () => {
    const invoice = new Invoice({
      dueAmount: 10,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoiceDatabase.push(invoice.toJSON());

    // has already enough confirmations
    let parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 5,
    };

    const response1 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response1.status).toEqual(HttpStatus.OK);
    expect(response1.text).toEqual("*ok*");
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();

    // has even more confirmations
    parameters = {
      signature: invoice.getSignature(SECRET),
      address: RECEIVING_ADDRESS,
      transaction_hash: "xxx",
      value: 10,
      confirmations: 10,
    };

    const response2 = await server.get(`/payment/handle-payment?${querystring.stringify(parameters)}`);

    expect(response2.status).toEqual(HttpStatus.OK);
    expect(response2.text).toEqual("*ok*");
    expect(processInvoicesDatabaseForSnapshot(invoiceDatabase)).toMatchSnapshot();
  });

  it("should accept custom logger", async () => {
    const mockLogger: ILogger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    blockchainMiddleware({
      secret: SECRET,
      requiredConfirmations: 3,
      saveInvoice,
      loadInvoice,
      log: mockLogger,
    });
  });
});

async function saveInvoice(invoice: Invoice): Promise<void> {
  // find invoice by address
  const index = invoiceDatabase.findIndex(item => item.address === invoice.address);

  // update existing invoice if exists, otherwise add a new one
  if (index !== -1) {
    invoiceDatabase[index] = invoice.toJSON();
  } else {
    invoiceDatabase.push(invoice.toJSON());
  }
}

async function loadInvoice(address: string): Promise<Invoice | undefined> {
  // search for invoice by address
  const invoiceInfo = invoiceDatabase.find(item => item.address === address);

  // return undefined if not found
  if (!invoiceInfo) {
    return undefined;
  }

  // de-serialize the invoice
  return new Invoice(invoiceInfo);
}

function processInvoicesDatabaseForSnapshot(invoices: IInvoice[]): IInvoice[] {
  invoices.forEach(processInvoiceForSnapshot);

  return invoices;
}
