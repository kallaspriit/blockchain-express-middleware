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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var dotenv = require("dotenv");
var express = require("express");
var fs = require("fs");
var http = require("http");
var HttpStatus = require("http-status-codes");
var https = require("https");
var querystring = require("querystring");
var src_1 = require("../src");
// load the .env configuration (https://github.com/motdotla/dotenv)
dotenv.config();
// constants
var HTTP_PORT = 80;
var DEFAULT_PORT = 3000;
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
        requiredConfirmations: process.env.APP_REQUIRED_CONFIRMATIONS !== undefined ? parseInt(process.env.APP_REQUIRED_CONFIRMATIONS, 10) : 1,
    },
};
// invoices "database" emulated with a simple array (store the data only)
var invoiceDatabase = [];
// initiate api
var api = new src_1.Blockchain(config.api, console);
// create the express server application
var app = express();
// parse application/x-www-form-urlencoded and  application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// use the blockchain middleware
app.use("/payment", src_1.default({
    secret: config.app.secret,
    requiredConfirmations: config.app.requiredConfirmations,
    saveInvoice: saveInvoice,
    loadInvoice: loadInvoice,
}));
// handle index view request
app.get("/", function (_request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var gap;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api.getGap()];
            case 1:
                gap = _a.sent();
                // show request payment form and list of existing payments
                response.send("\n    <h1>Bitcoin gateway</h1>\n\n    <h2>Request Bitcoin payment</h2>\n\n    <p><strong>Current gap: </strong> " + gap + " (see <a href=\"https://www.blockchain.com/en/api/api_receive\" target=\"_blank\">this for details</a>).</p>\n\n    <form method=\"post\" action=\"/pay\">\n      <p>\n        <input type=\"text\" name=\"dueAmount\" value=\"0.0001\" /> Amount (BTC)\n      </p>\n      <p>\n        <input type=\"text\" name=\"message\" value=\"Test payment\" /> Message\n      </p>\n      <p>\n        <input type=\"submit\" name=\"submit\" value=\"Request payment\" />\n      </p>\n    </form>\n\n    <h2>Bitcoin payments</h2>\n    <ul>\n      " + invoiceDatabase.map(function (item) { return new src_1.Invoice(item); }).map(function (invoice) { return "\n        <li>\n          <a href=\"/invoice/" + invoice.address + "\">" + invoice.message + "</a>\n          <ul>\n            <li><strong>Address:</strong> " + invoice.address + "</li>\n            <li><strong>Amount paid:</strong> " + src_1.satoshiToBitcoin(invoice.getPaidAmount()) + "/" + src_1.satoshiToBitcoin(invoice.dueAmount) + " BTC (" + invoice.getAmountState() + ")</li>\n            <li><strong>State:</strong> " + invoice.getPaymentState() + " (" + invoice.getConfirmationCount() + "/" + config.app.requiredConfirmations + ")</li>\n          </ul>\n        </li>\n      "; }) + "\n    </ul>\n  ");
                return [2 /*return*/];
        }
    });
}); });
// handle payment form request
app.post("/pay", function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
    var _a, dueAmount, message, invoice, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.body, dueAmount = _a.dueAmount, message = _a.message;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, api.createInvoice({
                        dueAmount: src_1.bitcoinToSatoshi(dueAmount),
                        message: message,
                        secret: config.app.secret,
                        callbackUrl: getAbsoluteUrl("/payment/handle-payment"),
                    })];
            case 2:
                invoice = _b.sent();
                // save the invoice (this would normally hit an actual database)
                return [4 /*yield*/, saveInvoice(invoice)];
            case 3:
                // save the invoice (this would normally hit an actual database)
                _b.sent();
                // redirect user to invoice view (use address as unique id)
                response.redirect("/invoice/" + invoice.address);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// handle invoice request
app.get("/invoice/:address", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var address, invoice, qrCodeParameters, qrCodeUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                address = request.params.address;
                return [4 /*yield*/, loadInvoice(address)];
            case 1:
                invoice = _a.sent();
                if (!invoice) {
                    response.status(HttpStatus.NOT_FOUND).send("Invoice with address \"" + address + "\" could not be found");
                    return [2 /*return*/];
                }
                qrCodeParameters = {
                    address: invoice.address,
                    amount: src_1.satoshiToBitcoin(invoice.dueAmount),
                    message: invoice.message,
                };
                qrCodeUrl = getAbsoluteUrl("/payment/qr?" + querystring.stringify(qrCodeParameters));
                // show payment request info along with the qr code to scan
                response.send("\n    <h1>Invoice</h1>\n\n    <ul>\n      <li><strong>Address:</strong> " + invoice.address + "</li>\n      <li><strong>Amount paid:</strong> " + src_1.satoshiToBitcoin(invoice.getPaidAmount()) + "/" + src_1.satoshiToBitcoin(invoice.dueAmount) + " BTC (" + invoice.getAmountState() + ")</li>\n      <li><strong>Message:</strong> " + invoice.message + "</li>\n      <li><strong>Confirmations:</strong> " + invoice.getConfirmationCount() + "/" + config.app.requiredConfirmations + "</li>\n      <li><strong>State:</strong> " + invoice.getPaymentState() + "</li>\n      <li><strong>Is complete:</strong> " + (invoice.isComplete() ? "yes" : "no") + "</li>\n      <li><strong>Created:</strong> " + invoice.createdDate.toISOString() + "</li>\n      <li><strong>Updated:</strong> " + invoice.updatedDate.toISOString() + "</li>\n      <li>\n        <strong>Transactions:</strong>\n        <ul>\n          " + invoice.transactions.map(function (transaction, index) { return "\n              <li>\n                <strong>Transaction #" + (index + 1) + "</strong>\n                <ul>\n                  <li><strong>Hash:</strong> " + transaction.hash + "</li>\n                  <li><strong>Amount:</strong> " + src_1.satoshiToBitcoin(transaction.amount) + " BTC</li>\n                  <li><strong>Confirmations:</strong> " + transaction.confirmations + "/" + config.app.requiredConfirmations + "</li>\n                  <li><strong>Created:</strong> " + transaction.createdDate.toISOString() + "</li>\n                  <li><strong>Updated:</strong> " + transaction.updatedDate.toISOString() + "</li>\n                </ul>\n              </li>\n          "; }) + "\n        </ul>\n      </li>\n      <li>\n        <strong>State transitions:</strong>\n        <ul>\n          " + invoice.stateTransitions.map(function (stateTransition, index) { return "\n              <li>\n                <strong>State transition #" + (index + 1) + "</strong>\n                <ul>\n                  <li><strong>Previous state:</strong> " + stateTransition.previousState + "</li>\n                  <li><strong>New state:</strong> " + stateTransition.newState + "</li>\n                  <li><strong>Date:</strong> " + stateTransition.date.toISOString() + "</li>\n                </ul>\n              </li>\n          "; }) + "\n        </ul>\n      </li>\n    </ul>\n\n    <p>\n      <img src=\"" + qrCodeUrl + "\"/>\n    </p>\n\n    <p>\n      <a href=\"" + getAbsoluteUrl("/invoice/" + address) + "\">Refresh this page</a> to check for updates.\n    </p>\n  ");
                return [2 /*return*/];
        }
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
function saveInvoice(invoice) {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            index = invoiceDatabase.findIndex(function (item) { return item.address === invoice.address; });
            // update existing invoice if exists, otherwise add a new one
            if (index !== -1) {
                invoiceDatabase[index] = invoice.toJSON();
            }
            else {
                invoiceDatabase.push(invoice.toJSON());
            }
            // save invoice for complete state is guaranteed to be called only once, ship out the products etc
            if (invoice.isComplete()) {
                console.log(invoice, "invoice is now complete");
            }
            return [2 /*return*/];
        });
    });
}
function loadInvoice(address) {
    return __awaiter(this, void 0, void 0, function () {
        var invoiceInfo;
        return __generator(this, function (_a) {
            invoiceInfo = invoiceDatabase.find(function (item) { return item.address === address; });
            // return undefined if not found
            if (!invoiceInfo) {
                return [2 /*return*/, undefined];
            }
            // de-serialize the invoice
            return [2 /*return*/, new src_1.Invoice(invoiceInfo)];
        });
    });
}
function getAbsoluteUrl(path) {
    var port = config.server.port === HTTP_PORT ? "" : ":" + config.server.port;
    var url = ("" + config.server.host + port + path).replace(/\/{2,}/g, "/");
    return (config.server.useSSL ? "https" : "http") + "://" + url;
}
//# sourceMappingURL=index.js.map