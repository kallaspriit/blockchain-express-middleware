"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var querystring = require("querystring");
var abstract_logger_1 = require("./abstract-logger");
var index_1 = require("./index");
/**
 * Default base configuration.
 */
exports.defaultBaseConfig = {
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
var Api = /** @class */ (function () {
    /**
     * Constructor.
     *
     * Accepts configuration and optional logger to use.
     *
     * @param userConfig User configuration (can override base configuration as well)
     * @param log Logger to use (defaults to console, but you can use bunyan etc)
     */
    function Api(userConfig, log) {
        if (log === void 0) { log = abstract_logger_1.dummyLogger; }
        this.log = log;
        this.config = __assign({}, exports.defaultBaseConfig, userConfig);
    }
    /**
     * Generates a new receiving address.
     *
     * @param callbackUrl URL to call on new transactions and confirmation count changes
     */
    Api.prototype.generateReceivingAddress = function (callbackUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, apiBaseUrl, xPub, apiKey, gapLimit, parameters, url, response, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.config, apiBaseUrl = _a.apiBaseUrl, xPub = _a.xPub, apiKey = _a.apiKey, gapLimit = _a.gapLimit;
                        parameters = {
                            xpub: xPub,
                            callback: callbackUrl,
                            key: apiKey,
                        };
                        // only add the gap limit parameters if it has been set
                        if (gapLimit !== undefined) {
                            parameters.gap_limit = gapLimit;
                        }
                        url = apiBaseUrl + "?" + querystring.stringify(parameters);
                        this.log.info({
                            parameters: parameters,
                            url: url,
                        }, "generating receiving address");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.get(url)];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                    case 3:
                        error_1 = _b.sent();
                        // log failure and rethrow the error
                        this.log.error({
                            message: error_1.message,
                            status: error_1.response.status,
                            statusText: error_1.response.statusText,
                            data: error_1.response.data,
                            parameters: parameters,
                            url: url,
                        }, "generating receiving address failed");
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new invoice.
     *
     * First generates the receiving address and then the invoice.
     *
     * @param info Invoice info
     */
    Api.prototype.createInvoice = function (_a) {
        var dueAmount = _a.dueAmount, message = _a.message, secret = _a.secret, callbackUrl = _a.callbackUrl;
        return __awaiter(this, void 0, void 0, function () {
            var signature, decoratedCallbackUrl, receivingAddress, invoice;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        signature = index_1.Invoice.getInvoiceSignature({
                            dueAmount: dueAmount,
                            message: message,
                        }, secret);
                        decoratedCallbackUrl = callbackUrl + "?" + querystring.stringify({ signature: signature });
                        return [4 /*yield*/, this.generateReceivingAddress(decoratedCallbackUrl)];
                    case 1:
                        receivingAddress = _b.sent();
                        invoice = new index_1.Invoice({
                            dueAmount: dueAmount,
                            message: message,
                            address: receivingAddress.address,
                        });
                        return [2 /*return*/, invoice];
                }
            });
        });
    };
    return Api;
}());
exports.default = Api;
//# sourceMappingURL=Blockchain.js.map