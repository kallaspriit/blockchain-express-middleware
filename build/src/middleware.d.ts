/// <reference types="express" />
import * as express from "express";
import { IInvoice } from "./index";
export interface IQrCodeParameters {
    address: string;
    amount: number | string;
    message: string;
}
export interface IOptions {
    secret: string;
    requiredConfirmations: number;
    saveInvoice(invoice: IInvoice): Promise<void>;
    loadInvoice(address: string): Promise<IInvoice | undefined>;
}
declare const _default: (options: IOptions) => express.Router;
export default _default;
