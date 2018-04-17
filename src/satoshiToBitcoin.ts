import { BITCOIN_TO_SATOSHI } from "./bitcoinToSatoshi";

export const SATOSHI_TO_BITCOIN = 1 / BITCOIN_TO_SATOSHI;

/**
 * Converts satoshis to bitcoins.
 *
 * @param value Amount in bitcoins
 */
export default function satoshiToBitcoin(microValue: number): number {
  return microValue * SATOSHI_TO_BITCOIN;
}
