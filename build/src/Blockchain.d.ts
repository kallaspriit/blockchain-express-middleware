import { ILogger } from "./abstract-logger";
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
 * Parameters for the generate receiving address endpoint.
 */
export interface IGenerateReceivingAddressParameters {
    xpub: string;
    callback: string;
    key: string;
    gap_limit?: number;
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
 * Default base configuration.
 */
export declare const defaultBaseConfig: IBlockchainBaseConfig;
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
    constructor(userConfig: IBlockchainUserConfig, log?: ILogger);
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
