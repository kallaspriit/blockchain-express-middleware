import Axios from "axios";
import * as querystring from "querystring";
import { dummyLogger, Logger } from "ts-log";
import { Invoice } from "./index";

/**
 * Combined configuration including base and user provided configurations.
 */
export interface BlockchainConfig {
  apiKey: string;
  xPub: string;
  apiBaseUrl?: string;
}

/**
 * Parameters for the generate receiving address endpoint.
 */
export interface GenerateReceivingAddressParameters {
  xpub: string;
  callback: string;
  key: string;
}

/**
 * Parameters for the checking xpub gap.
 */
export interface CheckGapParameters {
  xpub: string;
  key: string;
}

/**
 * Response for the generate receiving address request.
 */
export interface GenerateReceivingAddressResponse {
  address: string;
  index: number;
  callback: string;
}

/**
 * Response for the check gap request.
 */
export interface CheckGapResponse {
  gap: number;
}

/**
 * Parameters for creating an invoice.
 */
export interface CreateInvoiceInfo {
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
  private readonly config: Required<BlockchainConfig>;

  /**
   * Constructor.
   *
   * Accepts configuration and optional logger to use.
   *
   * @param userConfig User configuration (can override base configuration as well)
   * @param log Logger to use (defaults to console, but you can use bunyan etc)
   */
  public constructor(userConfig: BlockchainConfig, private readonly log: Logger = dummyLogger) {
    this.config = {
      apiBaseUrl: "https://api.blockchain.info/v2/receive",
      ...userConfig,
    };
  }

  /**
   * Generates a new receiving address.
   *
   * @param callbackUrl URL to call on new transactions and confirmation count changes
   */
  public async generateReceivingAddress(callbackUrl: string): Promise<GenerateReceivingAddressResponse> {
    const { apiBaseUrl, xPub, apiKey } = this.config;
    const parameters: GenerateReceivingAddressParameters = {
      xpub: xPub,
      callback: callbackUrl,
      key: apiKey,
    };

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
      const response = await Axios.get<GenerateReceivingAddressResponse>(url);

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
   * Returns current xpub gap.
   */
  public async getGap(): Promise<number> {
    const { apiBaseUrl, xPub, apiKey } = this.config;
    const parameters: CheckGapParameters = {
      xpub: xPub,
      key: apiKey,
    };

    // build the request url
    const url = `${apiBaseUrl}/checkgap?${querystring.stringify(parameters)}`;

    this.log.info(
      {
        parameters,
        url,
      },
      "checking gap",
    );

    // attempt to generate the receiving address (throws for non 2xx response)
    try {
      const response = await Axios.get<CheckGapResponse>(url);

      return response.data.gap;
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
        "getting gap failed",
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
  public async createInvoice({ dueAmount, message, secret, callbackUrl }: CreateInvoiceInfo): Promise<Invoice> {
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
