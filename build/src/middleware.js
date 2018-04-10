"use strict";
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var HttpStatus = require("http-status-codes");
var index_1 = require("./index");
// private constants
var OK_RESPONSE = "*ok*";
var PENDING_RESPONSE = "pending"; // actual value is not important
exports.default = (function (options) {
    var router = express.Router();
    // handle qr image request
    router.get("/qr", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
        var _a, address, amount, message, paymentRequestQrCode;
        return __generator(this, function (_b) {
            _a = request.query, address = _a.address, amount = _a.amount, message = _a.message;
            paymentRequestQrCode = index_1.Api.getPaymentRequestQrCode(address, amount, message);
            response.setHeader("Content-Type", "image/png");
            paymentRequestQrCode.pipe(response);
            return [2 /*return*/];
        });
    }); });
    // handle payment update request
    router.get("/handle-payment", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
        var _a, signature, address, transactionHash, value, confirmations, invoiceInfo, invoice, expectedSignature, isSignatureValid, isAddressValid, isHashValid, isUpdateValid, previousState, newState, hasSufficientConfirmations, isComplete, responseText;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = request.query, signature = _a.signature, address = _a.address, transactionHash = _a.transaction_hash, value = _a.value, confirmations = _a.confirmations;
                    return [4 /*yield*/, options.loadInvoice(address)];
                case 1:
                    invoiceInfo = _b.sent();
                    // give up if an invoice with given address could not be found
                    if (!invoiceInfo) {
                        console.log({
                            query: request.query,
                        }, "invoice could not be found");
                        // still send the OK response as we don't want any more updates on this invoice
                        response.send(OK_RESPONSE);
                        return [2 /*return*/];
                    }
                    invoice = new index_1.Invoice(invoiceInfo);
                    expectedSignature = invoice.getSignature(options.secret);
                    isSignatureValid = signature === expectedSignature;
                    isAddressValid = invoice.address === address;
                    isHashValid = true;
                    isUpdateValid = isSignatureValid && isAddressValid && isHashValid;
                    // respond with bad request if update was not valid
                    if (!isUpdateValid) {
                        // log failing update info
                        console.warn({
                            query: request.query,
                            info: { signature: signature, address: address, transactionHash: transactionHash, value: value, confirmations: confirmations },
                            invoice: invoice,
                            isSignatureValid: isSignatureValid,
                            isAddressValid: isAddressValid,
                            isHashValid: isHashValid,
                            isUpdateValid: isUpdateValid,
                        }, "got invalid payment update");
                        // respond with bad request
                        response.status(HttpStatus.BAD_REQUEST).send("got invalid payment status update");
                        return [2 /*return*/];
                    }
                    // adds new transaction or updates an existing one if already exists
                    invoice.registerTransaction({
                        hash: transactionHash,
                        amount: parseInt(value, 10),
                        confirmations: parseInt(confirmations, 10),
                        createdDate: new Date(),
                        updatedDate: new Date(),
                    });
                    previousState = invoice.getPaymentState();
                    newState = previousState;
                    // check for valid initial states to transition to paid or confirmed state
                    if ([index_1.InvoicePaymentState.PENDING, index_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION].indexOf(previousState) !== -1) {
                        hasSufficientConfirmations = invoice.hasSufficientConfirmations(options.requiredConfirmations);
                        newState = hasSufficientConfirmations
                            ? index_1.InvoicePaymentState.CONFIRMED
                            : index_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION;
                    }
                    // update invoice payment state
                    invoice.setPaymentState(newState);
                    // check whether invoice was just paid
                    if (previousState !== index_1.InvoicePaymentState.CONFIRMED && newState === index_1.InvoicePaymentState.CONFIRMED) {
                        // ship out the products etc..
                        // TODO: call some handler
                        console.log(invoice, "invoice is now confirmed");
                    }
                    isComplete = invoice.isComplete();
                    responseText = isComplete ? OK_RESPONSE : PENDING_RESPONSE;
                    // log the request info
                    console.log({
                        query: request.query,
                        info: { signature: signature, address: address, transactionHash: transactionHash, value: value, confirmations: confirmations },
                        invoice: invoice,
                        isSignatureValid: isSignatureValid,
                        isAddressValid: isAddressValid,
                        isHashValid: isHashValid,
                        isUpdateValid: isUpdateValid,
                        isComplete: isComplete,
                    }, "got valid payment update");
                    // save the invoice
                    return [4 /*yield*/, options.saveInvoice(invoice.toJSON())];
                case 2:
                    // save the invoice
                    _b.sent();
                    // respond with *ok* if we have reached a final state (will not get new updates after this)
                    response.send(responseText);
                    return [2 /*return*/];
            }
        });
    }); });
    return router;
});
//# sourceMappingURL=middleware.js.map