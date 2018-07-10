/**
 * Information needed to generate invoice signature.
 */
export interface InvoiceSignatureInfo {
    dueAmount: number;
    message: string;
}
/**
 * Transaction info.
 */
export interface Transaction {
    hash: string;
    amount: number;
    confirmations: number;
    createdDate: Date;
    updatedDate: Date;
}
/**
 * State transition info.
 */
export interface StateTransition {
    previousState: InvoicePaymentState;
    newState: InvoicePaymentState;
    date: Date;
}
/**
 * Invoice payment state enumeration.
 */
export declare enum InvoicePaymentState {
    PENDING = "PENDING",
    WAITING_FOR_CONFIRMATION = "WAITING_FOR_CONFIRMATION",
    CONFIRMED = "CONFIRMED"
}
/**
 * Invoice amount state enumeration.
 */
export declare enum InvoiceAmountState {
    EXACT = "EXACT",
    OVERPAID = "OVERPAID",
    UNDERPAID = "UNDERPAID"
}
/**
 * Serialized invoice info.
 */
export interface InvoiceInfo {
    dueAmount: number;
    message: string;
    address: string;
    createdDate: Date;
    updatedDate: Date;
    transactions: Transaction[];
    stateTransitions: StateTransition[];
    paymentState: InvoicePaymentState;
}
/**
 * Information needed to construct an invoice.
 */
export declare type InvoiceConstructorInfo = Pick<Invoice, "dueAmount" | "message" | "address">;
/**
 * Omit keys from interface.
 */
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/**
 * Represents an invoice.
 *
 * Note that the invoice expects amounts in satoshis.
 */
export default class Invoice {
    /**
     * Requested amount in satoshis due to be paid.
     */
    dueAmount: number;
    /**
     * Payment request message.
     */
    message: string;
    /**
     * Receiving address.
     */
    address: string;
    /**
     * Invoice created date.
     */
    createdDate: Date;
    /**
     * Invoice last updated date.
     */
    updatedDate: Date;
    /**
     * List of transactions associated with the invoice.
     */
    transactions: Transaction[];
    /**
     * List of invoice state transitions.
     */
    stateTransitions: StateTransition[];
    /**
     * Invoice payment state.
     */
    private paymentState;
    /**
     * Constructs the invoice.
     *
     * Accepts either the parameters required to create a new invoice or serialized invoice info.
     *
     * @param info Invoice constructor info or serialized invoice info
     */
    constructor(info: InvoiceConstructorInfo | InvoiceInfo);
    /**
     * Returns invoice signature.
     *
     * The signature is used to verify that the update requests originate from the correct source.
     *
     * @param info Signature info
     * @param secret Secret used to generate the signature
     */
    static getInvoiceSignature(info: InvoiceSignatureInfo, secret: string): string;
    /**
     * Returns whether requested state transition is valid.
     *
     * @param currentState Current invoice state
     * @param newState Requested invoice state
     */
    static isValidInvoiceStateTransition(currentState: InvoicePaymentState, newState: InvoicePaymentState): boolean;
    /**
     * Returns whether given invoice payment state is considered final.
     *
     * @param state Invoice payment state
     */
    static isCompleteState(state: InvoicePaymentState): boolean;
    /**
     * Registers payment transaction.
     *
     * Updates existing transaction if one exists, otherwise adds a new one.
     *
     * @param transaction Transaction info
     */
    registerTransaction(transaction: Omit<Transaction, "createdDate" | "updatedDate">): void;
    /**
     * Returns invoice paid amount.
     *
     * This is summed over all associated transactions.
     */
    getPaidAmount(): number;
    /**
     * Returns payment amount state.
     *
     * The invoice might be under or overpaid.
     */
    getAmountState(): InvoiceAmountState;
    /**
     * Returns invoice payment state.
     */
    getPaymentState(): InvoicePaymentState;
    /**
     * Sets new payment state.
     *
     * An error is thrown if requested state transition is not considered valid.
     *
     * @param newState New payment state
     */
    setPaymentState(newState: InvoicePaymentState): void;
    /**
     * Returns invoice signature.
     *
     * @param secret Secret passphrase
     */
    getSignature(secret: string): string;
    /**
     * Returns whether state transition to provided state would be valid.
     *
     * @param newState New state to consider
     */
    isValidStateTransition(newState: InvoicePaymentState): boolean;
    /**
     * Returns whether the invoice is complete.
     *
     * Complete invoices to not get any more updates.
     */
    isComplete(): boolean;
    /**
     * Returns the number of confirmations.
     *
     * The returned confirmation count is the minimum of all registered transactions and zero if none have been added.
     */
    getConfirmationCount(): number;
    /**
     * Returns whether the invoice has sufficient confirmations.
     *
     * This means that the associated transactions with the lowest number of confirmations needs to match this.
     *
     * @param requiredConfirmationCount Required confirmation count
     */
    hasSufficientConfirmations(requiredConfirmationCount?: number): boolean;
    /**
     * Returns serialized invoice info.
     *
     * The information returned by this method can be passed into the constructor to de-serialize the invoice.
     */
    toJSON(): InvoiceInfo;
}
