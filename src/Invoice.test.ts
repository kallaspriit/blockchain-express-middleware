import { Invoice, InvoiceAmountState, InvoicePaymentState } from "./";
import { processInvoiceForSnapshot } from "./Blockchain.test";

const RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";

describe("Invoice", () => {
  it("should enable serialization and de-serialization", async () => {
    const invoice = new Invoice({
      dueAmount: 1,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    const serialized = invoice.toJSON();
    const deSerialized = new Invoice(serialized);

    expect(processInvoiceForSnapshot(invoice)).toMatchSnapshot();
    expect(processInvoiceForSnapshot(serialized)).toMatchSnapshot();
    expect(processInvoiceForSnapshot(deSerialized)).toEqual(invoice);
  });

  it("should provide a static method for checking whether state transition is valid", async () => {
    expect(Invoice.isValidInvoiceStateTransition(InvoicePaymentState.PENDING, InvoicePaymentState.CONFIRMED)).toBe(
      true,
    );
    expect(Invoice.isValidInvoiceStateTransition(InvoicePaymentState.PENDING, InvoicePaymentState.PENDING)).toBe(true);
    expect(
      Invoice.isValidInvoiceStateTransition(InvoicePaymentState.PENDING, InvoicePaymentState.WAITING_FOR_CONFIRMATION),
    ).toBe(true);
    expect(Invoice.isValidInvoiceStateTransition(InvoicePaymentState.PENDING, InvoicePaymentState.CONFIRMED)).toBe(
      true,
    );
    expect(
      Invoice.isValidInvoiceStateTransition(
        InvoicePaymentState.WAITING_FOR_CONFIRMATION,
        InvoicePaymentState.CONFIRMED,
      ),
    ).toBe(true);
    expect(Invoice.isValidInvoiceStateTransition(InvoicePaymentState.CONFIRMED, InvoicePaymentState.PENDING)).toBe(
      false,
    );
  });

  it("should provide a static method for checking whether given state is complete", async () => {
    expect(Invoice.isCompleteState(InvoicePaymentState.PENDING)).toBe(false);
    expect(Invoice.isCompleteState(InvoicePaymentState.WAITING_FOR_CONFIRMATION)).toBe(false);
    expect(Invoice.isCompleteState(InvoicePaymentState.CONFIRMED)).toBe(true);
  });

  it("should handle registering a new transaction and update existing transactions", async () => {
    const invoice = new Invoice({
      dueAmount: 1,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 0,
    });

    invoice.registerTransaction({
      hash: "yyy",
      amount: 1,
      confirmations: 0,
    });

    // update first
    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 1,
    });

    expect(processInvoiceForSnapshot(invoice)).toMatchSnapshot();
  });

  it("should throw if updating transaction with a different amount", async () => {
    const invoice = new Invoice({
      dueAmount: 1,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 0,
    });

    expect(() =>
      invoice.registerTransaction({
        hash: "xxx",
        amount: 2, // changed amount
        confirmations: 1,
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  it("should handle registering a new transaction and update existing transactions", async () => {
    const invoice = new Invoice({
      dueAmount: 1,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 0,
    });

    invoice.registerTransaction({
      hash: "yyy",
      amount: 2,
      confirmations: 0,
    });

    // tslint:disable-next-line:no-magic-numbers
    expect(invoice.getPaidAmount()).toEqual(3);
  });

  it("should report amount state", async () => {
    const invoice = new Invoice({
      dueAmount: 5,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    invoice.registerTransaction({
      hash: "xxx",
      amount: 2,
      confirmations: 0,
    });

    expect(invoice.getAmountState()).toEqual(InvoiceAmountState.UNDERPAID);

    invoice.registerTransaction({
      hash: "yyy",
      amount: 3,
      confirmations: 0,
    });

    expect(invoice.getAmountState()).toEqual(InvoiceAmountState.EXACT);

    invoice.registerTransaction({
      hash: "zzz",
      amount: 1,
      confirmations: 0,
    });

    expect(invoice.getAmountState()).toEqual(InvoiceAmountState.OVERPAID);
  });

  it("should accept valid payment state updates", async () => {
    const invoice = new Invoice({
      dueAmount: 5,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    expect(invoice.getPaymentState()).toEqual(InvoicePaymentState.PENDING);

    // no change
    invoice.setPaymentState(InvoicePaymentState.PENDING);

    expect(invoice.getPaymentState()).toEqual(InvoicePaymentState.PENDING);

    // valid transition
    invoice.setPaymentState(InvoicePaymentState.WAITING_FOR_CONFIRMATION);

    expect(invoice.getPaymentState()).toEqual(InvoicePaymentState.WAITING_FOR_CONFIRMATION);

    // can't go back to pending
    expect(() => invoice.setPaymentState(InvoicePaymentState.PENDING)).toThrowErrorMatchingSnapshot();
  });

  it("should return valid signature", async () => {
    const invoice = new Invoice({
      dueAmount: 5,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    expect(invoice.getSignature("xxx")).toMatchSnapshot();
  });

  it("should return whether current state is complete", async () => {
    const invoice = new Invoice({
      dueAmount: 5,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    expect(invoice.isComplete()).toBe(false);

    invoice.setPaymentState(InvoicePaymentState.WAITING_FOR_CONFIRMATION);

    expect(invoice.isComplete()).toBe(false);

    invoice.setPaymentState(InvoicePaymentState.CONFIRMED);

    expect(invoice.isComplete()).toBe(true);
  });

  it("should return correct confirmation count", async () => {
    const invoice = new Invoice({
      dueAmount: 5,
      message: "Test",
      address: RECEIVING_ADDRESS,
    });

    expect(invoice.getConfirmationCount()).toBe(0);
    expect(invoice.hasSufficientConfirmations(2)).toBe(false);

    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 0,
    });

    expect(invoice.getConfirmationCount()).toBe(0);
    expect(invoice.hasSufficientConfirmations()).toBe(false);

    invoice.registerTransaction({
      hash: "xxx",
      amount: 1,
      confirmations: 1,
    });

    expect(invoice.getConfirmationCount()).toBe(1);
    expect(invoice.hasSufficientConfirmations(1)).toBe(true);

    invoice.registerTransaction({
      hash: "yyy",
      amount: 1,
      confirmations: 0,
    });

    expect(invoice.getConfirmationCount()).toBe(0);
    expect(invoice.hasSufficientConfirmations()).toBe(false);

    invoice.registerTransaction({
      hash: "zzz",
      amount: 1,
      confirmations: 5,
    });

    expect(invoice.getConfirmationCount()).toBe(0);
    expect(invoice.hasSufficientConfirmations()).toBe(false);
  });
});
