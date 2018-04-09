export interface IInvoiceSignatureInfo {
    id: string;
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
export default class Invoice {
    id: string;
    dueAmount: number;
    message: string;
    address?: string;
    transactions: ITransaction[];
    createdDate: Date;
    updatedDate: Date;
    private state;
    constructor({id, dueAmount, message}: Pick<Invoice, "id" | "dueAmount" | "message">);
    static getInvoiceSignature(info: IInvoiceSignatureInfo, key: string): string;
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
}
