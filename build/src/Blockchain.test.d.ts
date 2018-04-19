import { IInvoice, Invoice } from "./";
export declare function processInvoiceForSnapshot<T extends Invoice | IInvoice>(invoice: T): T;
