import Axios from "axios";
import * as qr from "qr-image";
import * as querystring from "querystring";

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

/* tslint:disable:no-any prefer-function-over-method */
export interface ILog {
  // trace(message?: any, ...optionalParams: any[]): void;
  // debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  // warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  [x: string]: any;
}

// dummy log that does not do anything
export const dummyLog: ILog = {
  info: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
  error: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
};
/* tslint:enable:no-any prefer-function-over-method */

/**
 * Default base configuration.
 */
export const defaultBaseConfig: IBlockchainBaseConfig = {
  apiBaseUrl: "https://api.blockchain.info/v2/receive",
};

// one bitcoin in 100 000 000 satoshis
export const BITCOIN_TO_SATOSHI = 100000000;

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
  public constructor(userConfig: IBlockchainUserConfig, private readonly log: ILog = dummyLog) {
    this.config = {
      ...defaultBaseConfig,
      ...userConfig,
    };
  }

  public static getPaymentRequestQrCode(
    address: string,
    amount: number | string,
    message: string,
    options: Partial<qr.Options> = {},
  ): NodeJS.ReadableStream {
    const payload = `bitcoin:${address}?${querystring.stringify({
      amount: amount.toString(),
      message,
    })}`;

    return qr.image(payload, {
      size: 4,
      type: "png",
      ...options,
    });
  }

  public static satoshiToBitcoin(microValue: number): number {
    return microValue / BITCOIN_TO_SATOSHI;
  }

  public static bitcoinToSatoshi(floatValue: number): number {
    return Math.floor(floatValue * BITCOIN_TO_SATOSHI);
  }

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
}
