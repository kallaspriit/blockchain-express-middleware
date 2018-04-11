export interface IInvoiceSignatureInfo {
    dueAmount: number;
    message: string;
}
export interface ITransaction {
    hash: string;
    amount: number;
    confirmations: number;
    createdDate: Date;
    updatedDate: Date;
}
export interface IStateTransition {
    previousState: InvoicePaymentState;
    newState: InvoicePaymentState;
    date: Date;
}
export declare enum InvoicePaymentState {
    PENDING = "PENDING",
    WAITING_FOR_CONFIRMATION = "WAITING_FOR_CONFIRMATION",
    CONFIRMED = "CONFIRMED",
}
export declare enum InvoiceAmountState {
    EXACT = "EXACT",
    OVERPAID = "OVERPAID",
    UNDERPAID = "UNDERPAID",
}
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
export declare type InvoiceConstructorInfo = Pick<Invoice, "dueAmount" | "message" | "address">;
export default class Invoice {
    dueAmount: number;
    message: string;
    address: string;
    createdDate: Date;
    updatedDate: Date;
    transactions: ITransaction[];
    stateTransitions: IStateTransition[];
    private paymentState;
    constructor(info: InvoiceConstructorInfo | IInvoice);
    static getInvoiceSignature(info: IInvoiceSignatureInfo, secret: string): string;
    static isValidInvoiceStateTransition(currentState: InvoicePaymentState, newState: InvoicePaymentState): boolean;
    static isCompleteState(state: InvoicePaymentState): boolean;
    registerTransaction(transaction: ITransaction): void;
    getPaidAmount(): number;
    getAmountState(): InvoiceAmountState;
    getPaymentState(): InvoicePaymentState;
    setPaymentState(newState: InvoicePaymentState): void;
    getSignature(key: string): string;
    isValidStateTransition(newState: InvoicePaymentState): boolean;
    isComplete(): boolean;
    getConfirmationCount(): number;
    hasSufficientConfirmations(requiredConfirmationCount: number): boolean;
    toJSON(): IInvoice;
}
