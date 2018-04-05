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
var bodyParser = require("body-parser");
var crypto_1 = require("crypto");
var dotenv = require("dotenv");
var express = require("express");
var fs = require("fs");
var http = require("http");
var HttpStatus = require("http-status-codes");
var https = require("https");
var querystring = require("querystring");
var uuid = require("uuid");
var src_1 = require("../src");
// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();
// constants
var HTTP_PORT = 80;
var DEFAULT_PORT = 3000;
var BITCOIN_TO_SATOSHI = 100000000;
// extract configuration from the .env environment variables
var config = {
    server: {
        host: process.env.SERVER_HOST !== undefined ? process.env.SERVER_HOST : "localhost",
        port: process.env.SERVER_PORT !== undefined ? parseInt(process.env.SERVER_PORT, 10) : DEFAULT_PORT,
        useSSL: process.env.SERVER_USE_SSL === "true",
        cert: process.env.SERVER_CERT !== undefined ? process.env.SERVER_CERT : "",
        key: process.env.SERVER_KEY !== undefined ? process.env.SERVER_KEY : "",
    },
    api: {
        apiKey: process.env.API_KEY !== undefined ? process.env.API_KEY : "",
        xPub: process.env.API_XPUB !== undefined ? process.env.API_XPUB : "",
    },
    app: {
        secret: process.env.APP_SECRET !== undefined ? process.env.APP_SECRET : "",
        requiredConfirmations: process.env.APP_REQUIRED_CONFIRMATIONS !== undefined ? parseInt(process.env.APP_REQUIRED_CONFIRMATIONS, 10) : "",
    },
};
// invoices "database"
var invoices = [];
// initiate api
var api = new src_1.Api(config.api);
// create the express server application
var app = express();
// parse application/x-www-form-urlencoded and  application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// handle index view request
app.get("/", function (_request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // show request payment form
        response.send("\n    <h1>Request Bitcoin payment</h1>\n\n    <form method=\"post\" action=\"/pay\">\n      <p>\n        <input type=\"text\" name=\"amount\" value=\"0.0001\" /> Amount (BTC)\n      </p>\n      <p>\n        <input type=\"text\" name=\"message\" value=\"Test payment\" /> Message\n      </p>\n      <p>\n        <input type=\"submit\" name=\"submit\" value=\"Request payment\" />\n      </p>\n    </form>\n  ");
        return [2 /*return*/];
    });
}); });
// handle payment form request
app.post("/pay", function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
    var _a, amount, message, id, invoice, signature, callbackUrl, receivingAddress, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.body, amount = _a.amount, message = _a.message;
                id = uuid.v4();
                invoice = {
                    id: id,
                    amount: bitcoinToSatoshi(amount),
                    message: message,
                    confirmations: 0,
                    isConfirmed: false,
                };
                // store the invoice in memory (this would really be a database)
                invoices.push(invoice);
                signature = getInvoiceSignature(invoice, config.app.secret);
                callbackUrl = getAbsoluteUrl("/handle-payment?" + querystring.stringify({ signature: signature }));
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, api.generateReceivingAddress(callbackUrl)];
            case 2:
                receivingAddress = _b.sent();
                // update invoice address
                invoice.address = receivingAddress.address;
                // redirect user to invoice view
                response.redirect("/invoice/" + invoice.id);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// handle invoice request
app.get("/invoice/:invoiceId", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var invoiceId, invoice, qrCodeParameters, qrCodeUrl;
    return __generator(this, function (_a) {
        invoiceId = request.params.invoiceId;
        invoice = invoices.find(function (item) { return item.id === invoiceId; });
        if (!invoice) {
            response.status(HttpStatus.NOT_FOUND).send("Invoice could not be found");
            return [2 /*return*/];
        }
        qrCodeParameters = { address: invoice.address, amount: invoice.amount, message: invoice.message };
        qrCodeUrl = getAbsoluteUrl("/qr?" + querystring.stringify(qrCodeParameters));
        // show payment request info along with the qr code to scan
        response.send("\n    <h1>Invoice</h1>\n\n    <ul>\n      <li><strong>Address:</strong> " + invoice.address + "</li>\n      <li><strong>Amount:</strong> " + satoshiToBitcoin(invoice.amount) + " BTC</li>\n      <li><strong>Message:</strong> " + invoice.message + "</li>\n      <li><strong>Confirmations:</strong> " + invoice.confirmations + "</li>\n      <li><strong>Is paid:</strong> " + (invoice.isConfirmed ? "yes" : "no") + "</li>\n    </ul>\n\n    <p>\n      <img src=\"" + qrCodeUrl + "\"/>\n    </p>\n\n    <p>\n      <a href=\"" + getAbsoluteUrl("/invoice/" + invoiceId) + "\">Refresh this page</a> to check for updates.\n    </p>\n  ");
        return [2 /*return*/];
    });
}); });
// handle qr image request
app.get("/qr", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var _a, address, amount, message, paymentRequestQrCode;
    return __generator(this, function (_b) {
        _a = request.query, address = _a.address, amount = _a.amount, message = _a.message;
        paymentRequestQrCode = src_1.Api.getPaymentRequestQrCode(address, amount, message);
        response.setHeader("Content-Type", "image/png");
        paymentRequestQrCode.pipe(response);
        return [2 /*return*/];
    });
}); });
// handle payment update request
app.get("/handle-payment", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var _a, signature, address, transactionHash, value, confirmations, invoice, expectedSignature, isSignatureValid, isAmountValid, isAddressValid, isUpdateValid, wasConfirmed;
    return __generator(this, function (_b) {
        _a = request.query, signature = _a.signature, address = _a.address, transactionHash = _a.transaction_hash, value = _a.value, confirmations = _a.confirmations;
        invoice = invoices.find(function (item) { return item.address === address; });
        // give up if an invoice with given address could not be found
        if (!invoice) {
            response.status(HttpStatus.NOT_FOUND).send("invoice not found");
            return [2 /*return*/];
        }
        expectedSignature = getInvoiceSignature(invoice, config.app.secret);
        isSignatureValid = signature === expectedSignature;
        isAmountValid = invoice.amount === parseInt(value, 10);
        isAddressValid = invoice.address === address;
        isUpdateValid = isSignatureValid && isAmountValid && isAddressValid;
        // update invoice info if update is valid
        if (isUpdateValid) {
            invoice.confirmations = parseInt(confirmations, 10);
            invoice.transactionHash = transactionHash;
        }
        console.log({
            query: request.query,
            info: { signature: signature, address: address, transactionHash: transactionHash, value: value, confirmations: confirmations },
            invoice: invoice,
            isSignatureValid: isSignatureValid,
            isAmountValid: isAmountValid,
            isAddressValid: isAddressValid,
            isUpdateValid: isUpdateValid,
        }, "handle payment update");
        wasConfirmed = invoice.isConfirmed;
        invoice.isConfirmed = invoice.confirmations >= config.app.requiredConfirmations;
        if (!wasConfirmed && invoice.isConfirmed) {
            // invoice has been paid, ship out the products etc..
            console.log(invoice, "invoice is now paid");
        }
        // respond with bad request if update was not valid
        if (!isUpdateValid) {
            response.status(HttpStatus.BAD_REQUEST).send("got invalid payment status update");
            return [2 /*return*/];
        }
        // respond with *ok* if we have received sufficient confirmations (will not get new updates after this)
        response.send(invoice.isConfirmed ? "*ok*" : "pending");
        return [2 /*return*/];
    });
}); });
// create either http or https server depending on SSL configuration
var server = config.server.useSSL
    ? https.createServer({
        cert: fs.readFileSync(config.server.cert),
        key: fs.readFileSync(config.server.key),
    }, app)
    : http.createServer(app);
// start the server
server.listen({
    host: "0.0.0.0",
    port: config.server.port,
}, function () {
    console.log("server started on port " + config.server.port);
});
// also start a http server to redirect to https if ssl is enabled
if (config.server.useSSL) {
    express()
        .use(function (request, response, _next) {
        response.redirect("https://" + request.hostname + request.originalUrl);
    })
        .listen(HTTP_PORT);
}
function getAbsoluteUrl(path) {
    var port = config.server.port === HTTP_PORT ? "" : ":" + config.server.port;
    var url = ("" + config.server.host + port + path).replace(/\/{2,}/g, "/");
    return (config.server.useSSL ? "https" : "http") + "://" + url;
}
function getInvoiceSignature(invoice, key) {
    var tokens = [invoice.id, invoice.amount.toString(), invoice.message];
    var payload = tokens.join(":");
    return crypto_1.createHmac("sha512", key)
        .update(payload)
        .digest("hex");
}
function satoshiToBitcoin(microValue) {
    return microValue / BITCOIN_TO_SATOSHI;
}
function bitcoinToSatoshi(floatValue) {
    return Math.floor(floatValue * BITCOIN_TO_SATOSHI);
}
//# sourceMappingURL=index.js.map