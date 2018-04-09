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
export declare enum InvoiceState {
    PENDING = "PENDING",
    PAID = "PAID",
    CONFIRMED = "CONFIRMED",
}
export default class Invoice {
    id: string;
    dueAmount: number;
    message: string;
    address?: string;
    state: InvoiceState;
    transactions: ITransaction[];
    constructor({id, dueAmount, message}: Pick<Invoice, "id" | "dueAmount" | "message">);
    static getInvoiceSignature(info: IInvoiceSignatureInfo, key: string): string;
    static isValidInvoiceStateTransition(currentState: InvoiceState, newState: InvoiceState): boolean;
    static isCompleteState(state: InvoiceState): boolean;
    registerTransaction(transaction: ITransaction): void;
    getPaidAmount(): number;
    getSignature(key: string): string;
    isValidStateTransition(newState: InvoiceState): boolean;
    isComplete(): boolean;
    hasSufficientConfirmations(requiredConfirmationCount: number): boolean;
}
