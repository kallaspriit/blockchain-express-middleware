import * as qr from "qr-image";
import * as querystring from "querystring";

/**
 * Generates QR code image for payment request.
 *
 * The image is returned as a readable stream.
 *
 * @param address Recipient address
 * @param amount Requested amount
 * @param message Optional payment request message
 * @param options Optional QR code image options
 */
export default function getPaymentRequestQrCode(
  address: string,
  amount: number | string,
  message?: string,
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
