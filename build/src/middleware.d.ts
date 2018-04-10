/// <reference types="express" />
import * as express from "express";
import { Invoice } from "./index";
export interface IQrCodeParameters {
    address: string;
    amount: number | string;
    message: string;
}
export interface IOptions {
    secret: string;
    requiredConfirmations: number;
    loadInvoice(address: string): Promise<Invoice | undefined>;
}
declare const _default: (options: IOptions) => express.Router;
export default _default;
