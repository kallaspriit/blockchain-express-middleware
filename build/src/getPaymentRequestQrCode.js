"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var qr = require("qr-image");
var querystring = require("querystring");
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
function getPaymentRequestQrCode(address, amount, message, options) {
    if (options === void 0) { options = {}; }
    var payload = "bitcoin:" + address + "?" + querystring.stringify({
        amount: amount.toString(),
        message: message,
    });
    return qr.image(payload, __assign({ size: 4, type: "png" }, options));
}
exports.default = getPaymentRequestQrCode;
//# sourceMappingURL=getPaymentRequestQrCode.js.map