import Axios from "axios";
import * as querystring from "querystring";
import { dummyLogger, ILogger } from "./abstract-logger";
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
export type IBlockchainUserConfig = Partial<IBlockchainBaseConfig> & IBlockchainRequiredConfig;

/**
 * Combined configuration including base and user provided configurations.
 */
export type IBlockchainConfig = IBlockchainBaseConfig & IBlockchainRequiredConfig;

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
export const defaultBaseConfig: IBlockchainBaseConfig = {
  apiBaseUrl: "https://api.blockchain.info/v2/receive",
};

/**
 * Provides API for receiving payments through blockchain.info service.
 *
 * To get the extended public key (xPub), copy your mnemonic words to http://bip32.org/ "Passphrase" field, wait for it
 * to generate the extended key and use the value of "Derived Public Key" as the "xPub" parameter.
 *
 * See https://blockchain.info/api/api_receive for API documentation.
 */
export default class Api {
  private readonly config: IBlockchainConfig;

  /**
   * Constructor.
   *
   * Accepts configuration and optional logger to use.
   *
   * @param userConfig User configuration (can override base configuration as well)
   * @param log Logger to use (defaults to console, but you can use bunyan etc)
   */
  public constructor(userConfig: IBlockchainUserConfig, private readonly log: ILogger = dummyLogger) {
    this.config = {
      ...defaultBaseConfig,
      ...userConfig,
    };
  }

  /**
   * Generates a new receiving address.
   *
   * @param callbackUrl URL to call on new transactions and confirmation count changes
   */
  public async generateReceivingAddress(callbackUrl: string): Promise<IReceivingAddress> {
    const { apiBaseUrl, xPub, apiKey, gapLimit } = this.config;
    const parameters: IGenerateReceivingAddressParameters = {
      xpub: xPub,
      callback: callbackUrl,
      key: apiKey,
    };

    // only add the gap limit parameters if it has been set
    if (gapLimit !== undefined) {
      parameters.gap_limit = gapLimit;
    }

    // build the request url
    const url = `${apiBaseUrl}?${querystring.stringify(parameters)}`;

    this.log.info(
      {
        parameters,
        url,
      },
      "generating receiving address",
    );

    // attempt to generate the receiving address (throws for non 2xx response)
    try {
      const response = await Axios.get<IReceivingAddress>(url);

      return response.data;
    } catch (error) {
      // log failure and rethrow the error
      this.log.error(
        {
          message: error.message,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          parameters,
          url,
        },
        "generating receiving address failed",
      );

      throw error;
    }
  }

  /**
   * Creates a new invoice.
   *
   * First generates the receiving address and then the invoice.
   *
   * @param info Invoice info
   */
  public async createInvoice({ dueAmount, message, secret, callbackUrl }: ICreateInvoiceInfo): Promise<Invoice> {
    // build invoice signature to later verify that the handle payment request is valid
    const signature = Invoice.getInvoiceSignature(
      {
        dueAmount,
        message,
      },
      secret,
    );

    // build the callback url, containing invoice info signed with the secret
    const decoratedCallbackUrl = `${callbackUrl}?${querystring.stringify({ signature })}`;

    // generate next receiving address
    const receivingAddress = await this.generateReceivingAddress(decoratedCallbackUrl);

    // create a new invoice
    const invoice = new Invoice({
      dueAmount,
      message,
      address: receivingAddress.address,
    });

    return invoice;
  }
}
