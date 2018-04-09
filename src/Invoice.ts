import { createHmac } from "crypto";

export interface IInvoiceSignatureInfo {
  id: string;
  dueAmount: number;
  message: string;
}

export interface ITransaction {
  hash: string;
  amount: number;
  confirmations: number;
}

interface IArrayMap<T> {
  [x: string]: T[] | undefined;
}

// invoice payment state
export enum InvoicePaymentState {
  // invoice has been created but no payment updates have been received
  PENDING = "PENDING",

  // invoice has been paid but not yet confirmed, waiting for required confirmations
  // note that it may have been under- or overpaid, check the amounts
  WAITING_FOR_CONFIRMATION = "WAITING_FOR_CONFIRMATION",

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

// invoice amount state
export enum InvoiceAmountState {
  EXACT = "EXACT",
  OVERPAID = "OVERPAID",
  UNDERPAID = "UNDERPAID",
}

export default class Invoice {
  public id: string;
  public dueAmount: number;
  public message: string;
  public address?: string;
  // public amountPaid = 0;
  // public confirmations = 0;
  public state = InvoicePaymentState.PENDING;
  public transactions: ITransaction[] = [];

  public constructor({ id, dueAmount, message }: Pick<Invoice, "id" | "dueAmount" | "message">) {
    this.id = id;
    this.dueAmount = dueAmount;
    this.message = message;
  }
  // TODO: created, updated, paid date
  // TODO: expiry date?
  // TODO: state transitions

  public static getInvoiceSignature(info: IInvoiceSignatureInfo, key: string) {
    const tokens = [info.id, info.dueAmount.toString(), info.message];
    const payload = tokens.join(":");

    return createHmac("sha512", key)
      .update(payload)
      .digest("hex");
  }

  public static isValidInvoiceStateTransition(
    currentState: InvoicePaymentState,
    newState: InvoicePaymentState,
  ): boolean {
    // allow not changing the state
    if (currentState === newState) {
      return true;
    }

    // map of current to possible new states
    const validTransitionsMap: IArrayMap<InvoicePaymentState> = {
      [InvoicePaymentState.PENDING]: [InvoicePaymentState.WAITING_FOR_CONFIRMATION, InvoicePaymentState.CONFIRMED],
      [InvoicePaymentState.WAITING_FOR_CONFIRMATION]: [InvoicePaymentState.CONFIRMED],
      [InvoicePaymentState.CONFIRMED]: [],
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

  public static isCompleteState(state: InvoicePaymentState) {
    const completeStates: InvoicePaymentState[] = [InvoicePaymentState.CONFIRMED];

    return completeStates.indexOf(state) !== -1;
  }

  public registerTransaction(transaction: ITransaction) {
    // attempt to find existing transaction with the same hash
    const existingTransaction = this.transactions.find(item => item.hash === transaction.hash);

    // update existing transaction if it exists
    if (existingTransaction !== undefined) {
      // make sure the amount is the same
      if (existingTransaction.amount !== transaction.amount) {
        throw new Error(
          `Invoice "${this.id}" existing transaction "${existingTransaction.hash}" amount of ${
            existingTransaction.amount
          } is different from the new amount of ${transaction.amount}, this should not happen`,
        );
      }

      // update existing transaction
      existingTransaction.confirmations = transaction.confirmations;
    }

    // add a new transaction
    this.transactions.push(transaction);
  }

  public getPaidAmount(): number {
    return this.transactions.reduce((paidAmount, transaction) => paidAmount + transaction.amount, 0);
  }

  public getAmountState(): InvoiceAmountState {
    const paidAmount = this.getPaidAmount();
    const dueAmount = this.dueAmount;

    if (paidAmount > dueAmount) {
      return InvoiceAmountState.OVERPAID;
    } else if (paidAmount < dueAmount) {
      return InvoiceAmountState.UNDERPAID;
    }

    return InvoiceAmountState.EXACT;
  }

  public getSignature(key: string) {
    return Invoice.getInvoiceSignature(this, key);
  }

  public isValidStateTransition(newState: InvoicePaymentState): boolean {
    return Invoice.isValidInvoiceStateTransition(this.state, newState);
  }

  public isComplete(): boolean {
    return Invoice.isCompleteState(this.state);
  }

  public hasSufficientConfirmations(requiredConfirmationCount: number) {
    // we need at least one transaction to be confirmed
    if (this.transactions.length === 0) {
      return false;
    }

    // if any of the transactions have less than required confirmations then return false
    for (const transaction of this.transactions) {
      if (transaction.confirmations < requiredConfirmationCount) {
        return false;
      }
    }

    // all transactions have sufficient confirmations
    return true;
  }
}
