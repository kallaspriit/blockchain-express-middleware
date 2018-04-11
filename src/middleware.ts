import * as express from "express";
import * as HttpStatus from "http-status-codes";
import { Api, Invoice, InvoicePaymentState } from "./index";

export interface IQrCodeParameters {
  address: string;
  amount: number | string;
  message: string;
}

export interface IOptions {
  secret: string;
  requiredConfirmations: number;
  saveInvoice(invoice: Invoice): Promise<void>;
  loadInvoice(address: string): Promise<Invoice | undefined>;
}

// private constants
const OK_RESPONSE = "*ok*";
const PENDING_RESPONSE = "pending"; // actual value is not important

export default (options: IOptions): express.Router => {
  const router = express.Router();

  // handle qr image request
  router.get("/qr", async (request, response, _next) => {
    // TODO: validate request parameters
    const { address, amount, message } = request.query as IQrCodeParameters;

    const paymentRequestQrCode = Api.getPaymentRequestQrCode(address, amount, message);

    response.setHeader("Content-Type", "image/png");
    paymentRequestQrCode.pipe(response);
  });

  // handle payment update request
  router.get("/handle-payment", async (request, response, _next) => {
    // TODO: validate request parameters
    // TODO: ignore the payload and ask https://blockchain.info/rawaddr/ instead?
    const { signature, address, transaction_hash: transactionHash, value, confirmations } = request.query;
    const invoiceInfo = await options.loadInvoice(address);

    // give up if an invoice with given address could not be found
    if (!invoiceInfo) {
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

    // de-serialize the invoice
    const invoice = new Invoice(invoiceInfo);

    // calculate expected signature
    const expectedSignature = invoice.getSignature(options.secret);

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

    // don't update an invoice that is already complete, also stop status updates
    if (invoice.isComplete()) {
      response.send(OK_RESPONSE);

      return;
    }

    // adds new transaction or updates an existing one if already exists
    invoice.registerTransaction({
      hash: transactionHash,
      amount: parseInt(value, 10),
      confirmations: parseInt(confirmations, 10),
      createdDate: new Date(),
      updatedDate: new Date(),
    });

    // remember previous state and resolve new state
    const previousState = invoice.getPaymentState();
    let newState = previousState;

    // check for valid initial states to transition to paid or confirmed state
    if ([InvoicePaymentState.PENDING, InvoicePaymentState.WAITING_FOR_CONFIRMATION].indexOf(previousState) !== -1) {
      const hasSufficientConfirmations = invoice.hasSufficientConfirmations(options.requiredConfirmations);

      newState = hasSufficientConfirmations
        ? InvoicePaymentState.CONFIRMED
        : InvoicePaymentState.WAITING_FOR_CONFIRMATION;
    }

    // update invoice payment state
    invoice.setPaymentState(newState);

    // check whether invoice was just paid
    if (previousState !== InvoicePaymentState.CONFIRMED && newState === InvoicePaymentState.CONFIRMED) {
      // ship out the products etc..
      // TODO: call some handler
      console.log(invoice, "invoice is now confirmed");
    }

    // check whether handling given invoice is complete and respond accordingly
    const isComplete = invoice.isComplete();
    const responseText = isComplete ? OK_RESPONSE : PENDING_RESPONSE;

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

    // save the invoice
    await options.saveInvoice(invoice);

    // respond with ok if we have reached a final state (will not get new updates after this)
    response.send(responseText);
  });

  return router;
};
