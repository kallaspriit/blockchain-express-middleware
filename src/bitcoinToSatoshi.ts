export const BITCOIN_TO_SATOSHI = 100000000;

/**
 * Converts bitcoins to satoshis.
 *
 * @param value Amount in bitcoins
 */
export default function bitcoinToSatoshi(value: number | string): number {
  const floatValue = typeof value === "string" ? parseFloat(value) : value;

  return Math.floor(floatValue * BITCOIN_TO_SATOSHI);
}
