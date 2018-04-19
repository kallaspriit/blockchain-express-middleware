"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinToSatoshi_1 = require("./bitcoinToSatoshi");
exports.SATOSHI_TO_BITCOIN = 1 / bitcoinToSatoshi_1.BITCOIN_TO_SATOSHI;
/**
 * Converts satoshis to bitcoins.
 *
 * @param value Amount in bitcoins
 */
function satoshiToBitcoin(microValue) {
    return microValue * exports.SATOSHI_TO_BITCOIN;
}
exports.default = satoshiToBitcoin;
//# sourceMappingURL=satoshiToBitcoin.js.map