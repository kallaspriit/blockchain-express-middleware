import { createHmac } from "crypto";

/**
 * Information needed to generate invoice signature.
 */
export interface IInvoiceSignatureInfo {
  dueAmount: number;
  message: string;
}

/**
 * Transaction info.
 */
export interface ITransaction {
  hash: string;
  amount: number;
  confirmations: number;
  createdDate: Date;
  updatedDate: Date;
}

/**
 * State transition info.
 */
export interface IStateTransition {
  previousState: InvoicePaymentState;
  newState: InvoicePaymentState;
  date: Date;
}

/**
 * Invoice payment state enumeration.
 */
export enum InvoicePaymentState {
  // invoice has been created but no payment updates have been received
  PENDING = "PENDING",

  // invoice has been paid but not yet confirmed, waiting for required confirmations
  // note that it may have been under- or overpaid, check the amounts
  WAITING_FOR_CONFIRMATION = "WAITING_FOR_CONFIRMATION",

  // invoice has been paid and received sufficient confirmations
  // note that it may have been under- or overpaid, check the amounts
  CONFIRMED = "CONFIRMED",
}

/**
 * Invoice amount state enumeration.
 */
export enum InvoiceAmountState {
  EXACT = "EXACT",
  OVERPAID = "OVERPAID",
  UNDERPAID = "UNDERPAID",
}

/**
 * Serialized invoice info.
 */
export interface IInvoice {
  dueAmount: number;
  message: string;
  address: string;
  createdDate: Date;
  updatedDate: Date;
  transactions: ITransaction[];
  stateTransitions: IStateTransition[];
  paymentState: InvoicePaymentState;
}

/**
 * Information needed to construct an invoice.
 */
export type InvoiceConstructorInfo = Pick<Invoice, "dueAmount" | "message" | "address">;

/**
 * Simple array map type.
 */
interface IArrayMap<T> {
  [x: string]: T[] | undefined;
}

/**
 * Represents an invoice.
 *
 * Note that the invoice expects amounts in satoshis.
 */
export default class Invoice {
  /**
   * Requested amount in satoshis due to be paid.
   */
  public dueAmount: number;

  /**
   * Payment request message.
   */
  public message: string;

  /**
   * Receiving address.
   */
  public address: string;

  /**
   * Invoice created date.
   */
  public createdDate: Date;

  /**
   * Invoice last updated date.
   */
  public updatedDate: Date;

  /**
   * List of transactions associated with the invoice.
   */
  public transactions: ITransaction[] = [];

  /**
   * List of invoice state transitions.
   */
  public stateTransitions: IStateTransition[] = [];

  /**
   * Invoice payment state.
   */
  private paymentState = InvoicePaymentState.PENDING;

  /**
   * Constructs the invoice.
   *
   * Accepts either the parameters required to create a new invoice or serialized invoice info.
   *
   * @param info Invoice constructor info or serialized invoice info
   */
  public constructor(info: InvoiceConstructorInfo | IInvoice) {
    // check whether we got the serialized info
    if (isSerializedInvoice(info)) {
      // de-serialize if data matching invoice interface is given
      this.dueAmount = info.dueAmount;
      this.message = info.message;
      this.address = info.address;
      this.createdDate = info.createdDate;
      this.updatedDate = info.updatedDate;
      this.transactions = info.transactions;
      this.stateTransitions = info.stateTransitions;
      this.paymentState = info.paymentState;
    } else {
      // otherwise create new invoice
      this.dueAmount = info.dueAmount;
      this.message = info.message;
      this.address = info.address;
      this.createdDate = new Date();
      this.updatedDate = new Date();
    }
  }

  /**
   * Returns invoice signature.
   *
   * The signature is used to verify that the update requests originate from the correct source.
   *
   * @param info Signature info
   * @param secret Secret used to generate the signature
   */
  public static getInvoiceSignature(info: IInvoiceSignatureInfo, secret: string) {
    // build the signature payload
    const tokens = [info.dueAmount.toString(), info.message];
    const payload = tokens.join(":");

    // create a sha512 hash-based message authentication code digested as hex
    return createHmac("sha512", secret)
      .update(payload)
      .digest("hex");
  }

  /**
   * Returns whether requested state transition is valid.
   *
   * @param currentState Current invoice state
   * @param newState Requested invoice state
   */
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

  /**
   * Returns whether given invoice payment state is considered final.
   *
   * @param state Invoice payment state
   */
  public static isCompleteState(state: InvoicePaymentState) {
    const completeStates: InvoicePaymentState[] = [InvoicePaymentState.CONFIRMED];

    return completeStates.indexOf(state) !== -1;
  }

  /**
   * Registers payment transaction.
   *
   * Updates existing transaction if one exists, otherwise adds a new one.
   *
   * @param transaction Transaction info
   */
  public registerTransaction(transaction: ITransaction) {
    // update updated date
    this.updatedDate = new Date();

    // attempt to find existing transaction with the same hash
    const existingTransaction = this.transactions.find(item => item.hash === transaction.hash);

    // update existing transaction if it exists
    if (existingTransaction !== undefined) {
      // make sure the amount is the same
      if (existingTransaction.amount !== transaction.amount) {
        throw new Error(
          `Invoice "${this.address}" existing transaction "${existingTransaction.hash}" amount of ${
            existingTransaction.amount
          } is different from the new amount of ${transaction.amount}, this should not happen`,
        );
      }

      // update existing transaction
      existingTransaction.confirmations = transaction.confirmations;
      existingTransaction.updatedDate = new Date();

      return;
    }

    // transaction does not exist, add a new one
    this.transactions.push(transaction);
  }

  /**
   * Returns invoice paid amount.
   *
   * This is summed over all associated transactions.
   */
  public getPaidAmount(): number {
    return this.transactions.reduce((paidAmount, transaction) => paidAmount + transaction.amount, 0);
  }

  /**
   * Returns payment amount state.
   *
   * The invoice might be under or overpaid.
   */
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

  /**
   * Returns invoice payment state.
   */
  public getPaymentState(): InvoicePaymentState {
    return this.paymentState;
  }

  /**
   * Sets new payment state.
   *
   * An error is thrown if requested state transition is not considered valid.
   *
   * @param newState New payment state
   */
  public setPaymentState(newState: InvoicePaymentState) {
    // ignore no state change
    if (newState === this.paymentState) {
      return;
    }

    // throw error if invalid state transition is requested
    if (!this.isValidStateTransition(newState)) {
      throw new Error(`Invalid state transition from "${this.paymentState}" to "${newState}"`);
    }

    // register the state transition
    this.stateTransitions.push({
      previousState: this.paymentState,
      newState,
      date: new Date(),
    });

    // update the invoice payment state
    this.paymentState = newState;
    this.updatedDate = new Date();
  }

  /**
   * Returns invoice signature.
   *
   * @param secret Secret passphrase
   */
  public getSignature(secret: string) {
    return Invoice.getInvoiceSignature(this, secret);
  }

  /**
   * Returns whether state transition to provided state would be valid.
   *
   * @param newState New state to consider
   */
  public isValidStateTransition(newState: InvoicePaymentState): boolean {
    return Invoice.isValidInvoiceStateTransition(this.paymentState, newState);
  }

  /**
   * Returns whether the invoice is complete.
   *
   * Complete invoices to not get any more updates.
   */
  public isComplete(): boolean {
    return Invoice.isCompleteState(this.paymentState);
  }

  /**
   * Returns the number of confirmations.
   *
   * The returned confirmation count is the minimum of all registered transactions and zero if none have been added.
   */
  public getConfirmationCount(): number {
    // consider lack of transactions as zero confirmations
    if (this.transactions.length === 0) {
      return 0;
    }

    // start at positive infinity
    let minimumConfirmationCount = Infinity;

    // find the minimum confirmation count
    for (const transaction of this.transactions) {
      if (transaction.confirmations < minimumConfirmationCount) {
        minimumConfirmationCount = transaction.confirmations;
      }
    }

    return minimumConfirmationCount;
  }

  /**
   * Returns whether the invoice has sufficient confirmations.
   *
   * This means that the associated transactions with the lowest number of confirmations needs to match this.
   *
   * @param requiredConfirmationCount Required confirmation count
   */
  public hasSufficientConfirmations(requiredConfirmationCount = 3) {
    return this.getConfirmationCount() >= requiredConfirmationCount;
  }

  /**
   * Returns serialized invoice info.
   *
   * The information returned by this method can be passed into the constructor to de-serialize the invoice.
   */
  public toJSON(): IInvoice {
    return {
      dueAmount: this.dueAmount,
      message: this.message,
      address: this.address,
      createdDate: this.createdDate,
      updatedDate: this.updatedDate,
      transactions: this.transactions,
      stateTransitions: this.stateTransitions,
      paymentState: this.getPaymentState(),
    };
  }
}

/**
 * Returns whether given information likely matches serialized invoice interface.
 */
// tslint:disable-next-line:no-any
function isSerializedInvoice(info: any): info is IInvoice {
  return info.paymentState !== undefined;
}
