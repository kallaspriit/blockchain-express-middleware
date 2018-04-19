import * as bodyParser from "body-parser";
import * as express from "express";
import * as querystring from "querystring";
import * as supertest from "supertest";
import blockchainMiddleware, { IInvoice, Invoice } from "./";

const SECRET = "zzz";
const RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";

// invoices "database" emulated with a simple array (store the data only)
const invoiceDatabase: IInvoice[] = [];

let server: supertest.SuperTest<supertest.Test>;

// tslint:disable:no-magic-numbers
describe("middleware", () => {
  beforeEach(() => {
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

  // save invoice for complete state is guaranteed to be called only once, ship out the products etc
  if (invoice.isComplete()) {
    console.log(invoice, "invoice is now complete");
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
