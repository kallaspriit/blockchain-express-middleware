/// <reference types="node" />
import * as qr from "qr-image";
import { Invoice } from "./index";
/**
 * Base configuration that has reasonable defaults and do no require to be redefined by the user.
 */
export interface IBlockchainBaseConfig {
    apiBaseUrl: string;
    gapLimit?: number;
}
/**
 * Configuration required to be provided by the user.
 */
export interface IBlockchainRequiredConfig {
    apiKey: string;
    xPub: string;
}
/**
 * Configuration that the user provides, includes mandatory user configuration and optional base configuration.
 */
export declare type IBlockchainUserConfig = Partial<IBlockchainBaseConfig> & IBlockchainRequiredConfig;
/**
 * Combined configuration including base and user provided configurations.
 */
export declare type IBlockchainConfig = IBlockchainBaseConfig & IBlockchainRequiredConfig;
/**
 * Receiving address response.
 */
export interface IReceivingAddress {
    address: string;
    index: number;
    callback: string;
}
export interface IGenerateReceivingAddressParameters {
    xpub: string;
    callback: string;
    key: string;
    gap_limit?: number;
}
export interface ICreateInvoiceInfo {
    dueAmount: number;
    message: string;
    secret: string;
    callbackUrl: string;
}
export interface ILog {
    info(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    [x: string]: any;
}
export declare const dummyLog: ILog;
/**
 * Default base configuration.
 */
export declare const defaultBaseConfig: IBlockchainBaseConfig;
export declare const BITCOIN_TO_SATOSHI = 100000000;
/**
 * Provides API for receiving payments through blockchain.info service.
 *
 * To get the extended public key (xPub), copy your mnemonic words to http://bip32.org/ "Passphrase" field, wait for it
 * to generate the extended key and use the value of "Derived Public Key" as the "xPub" parameter.
 *
 * See https://blockchain.info/api/api_receive for API documentation.
 */
export default class Api {
    private readonly log;
    private readonly config;
    /**
     * Constructor.
     *
     * Accepts configuration and optional logger to use.
     *
     * @param userConfig User configuration (can override base configuration as well)
     * @param log Logger to use (defaults to console, but you can use bunyan etc)
     */
    constructor(userConfig: IBlockchainUserConfig, log?: ILog);
    static getPaymentRequestQrCode(address: string, amount: number | string, message: string, options?: Partial<qr.Options>): NodeJS.ReadableStream;
    static satoshiToBitcoin(microValue: number): number;
    static bitcoinToSatoshi(value: number | string): number;
    generateReceivingAddress(callbackUrl: string): Promise<IReceivingAddress>;
    createInvoice(info: ICreateInvoiceInfo): Promise<Invoice>;
}
