/// <reference types="express" />
import * as express from "express";
import { ILogger, Invoice } from "./index";
export interface IQrCodeParameters {
    address: string;
    amount: number | string;
    message: string;
}
export interface IOptions {
    secret: string;
    requiredConfirmations: number;
    log?: ILogger;
    saveInvoice(invoice: Invoice): Promise<void>;
    loadInvoice(address: string): Promise<Invoice | undefined>;
}
declare const _default: (options: IOptions) => express.Router;
export default _default;
