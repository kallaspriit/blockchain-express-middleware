import * as express from "express";
import { Logger } from "ts-log";
import { Invoice } from "./index";
export interface QrCodeParameters {
    address: string;
    amount: number | string;
    message: string;
}
export interface BlockchainMiddlewareOptions {
    secret: string;
    requiredConfirmations: number;
    log?: Logger;
    saveInvoice(invoice: Invoice): Promise<void>;
    loadInvoice(address: string): Promise<Invoice | undefined>;
}
declare const _default: (options: BlockchainMiddlewareOptions) => express.Router;
export default _default;
