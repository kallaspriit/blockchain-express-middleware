"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BITCOIN_TO_SATOSHI = 100000000;
/**
 * Converts bitcoins to satoshis.
 *
 * @param value Amount in bitcoins
 */
function bitcoinToSatoshi(value) {
    var floatValue = typeof value === "string" ? parseFloat(value) : value;
    return Math.floor(floatValue * exports.BITCOIN_TO_SATOSHI);
}
exports.default = bitcoinToSatoshi;
//# sourceMappingURL=bitcoinToSatoshi.js.map