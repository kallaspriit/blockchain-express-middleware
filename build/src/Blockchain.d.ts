import { ILogger } from "ts-log";
import { Invoice } from "./index";
/**
 * Combined configuration including base and user provided configurations.
 */
export interface IBlockchainConfig {
    apiKey: string;
    xPub: string;
    apiBaseUrl?: string;
}
/**
 * Parameters for the generate receiving address endpoint.
 */
export interface IGenerateReceivingAddressParameters {
    xpub: string;
    callback: string;
    key: string;
}
/**
 * Response for the generate receiving address endpoint.
 */
export interface IReceivingAddress {
    address: string;
    index: number;
    callback: string;
}
/**
 * Parameters for creating an invoice.
 */
export interface ICreateInvoiceInfo {
    dueAmount: number;
    message: string;
    secret: string;
    callbackUrl: string;
}
/**
 * Provides API for receiving payments through blockchain.info service.
 *
 * To get the extended public key (xPub), copy your mnemonic words to http://bip32.org/ "Passphrase" field, wait for it
 * to generate the extended key and use the value of "Derived Public Key" as the "xPub" parameter.
 *
 * See https://blockchain.info/api/api_receive for API documentation.
 */
export default class Blockchain {
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
    constructor(userConfig: IBlockchainConfig, log?: ILogger);
    /**
     * Generates a new receiving address.
     *
     * @param callbackUrl URL to call on new transactions and confirmation count changes
     */
    generateReceivingAddress(callbackUrl: string): Promise<IReceivingAddress>;
    /**
     * Creates a new invoice.
     *
     * First generates the receiving address and then the invoice.
     *
     * @param info Invoice info
     */
    createInvoice({dueAmount, message, secret, callbackUrl}: ICreateInvoiceInfo): Promise<Invoice>;
}
