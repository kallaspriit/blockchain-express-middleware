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
var dotenv = require("dotenv");
var express = require("express");
var fs = require("fs");
var http = require("http");
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
        port: process.env.SERVER_PORT !== undefined ? process.env.SERVER_PORT : DEFAULT_PORT,
        useSSL: process.env.SERVER_USE_SSL === "true",
        cert: process.env.SERVER_CERT !== undefined ? process.env.SERVER_CERT : "",
        key: process.env.SERVER_KEY !== undefined ? process.env.SERVER_KEY : "",
    },
    api: {
        apiKey: process.env.API_KEY !== undefined ? process.env.API_KEY : "",
        xPub: process.env.API_XPUB !== undefined ? process.env.API_XPUB : "",
    },
    app: {
        address: process.env.APP_ADDRESS !== undefined ? process.env.APP_ADDRESS : "",
    },
};
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
        response.send("\n    <h1>Request Bitcoin payment</h1>\n\n    <form method=\"post\" action=\"/pay\">\n      <p>\n        <input type=\"text\" name=\"address\" value=\"" + config.app.address + "\" /> Address\n      </p>\n      <p>\n        <input type=\"text\" name=\"amount\" value=\"0.001\" /> Amount (BTC)\n      </p>\n      <p>\n        <input type=\"text\" name=\"message\" value=\"Test payment\" /> Message\n      </p>\n      <p>\n        <input type=\"submit\" name=\"submit\" value=\"Request payment\" />\n      </p>\n    </form>\n  ");
        return [2 /*return*/];
    });
}); });
// handle payment form request
app.post("/pay", function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
    var _a, address, amount, message, qrCodeParameters, qrCodePayload, callbackUrl, qrCodeUrl, receivingAddress, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.body, address = _a.address, amount = _a.amount, message = _a.message;
                qrCodeParameters = {
                    amount: amount,
                    message: message,
                };
                qrCodePayload = "bitcoin:" + address + "?" + querystring.stringify(qrCodeParameters);
                callbackUrl = getAbsoluteUrl("/handle-payment");
                qrCodeUrl = getAbsoluteUrl("/qr?" + querystring.stringify({ payload: qrCodePayload }));
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, api.generateReceivingAddress(callbackUrl)];
            case 2:
                receivingAddress = _b.sent();
                response.send({
                    address: address,
                    amount: amount,
                    message: message,
                    receivingAddress: receivingAddress,
                    qrCodeParameters: qrCodeParameters,
                    qrCodePayload: qrCodePayload,
                    qrCodeUrl: qrCodeUrl,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// handle qr image request
app.get("/qr", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    var payload, image;
    return __generator(this, function (_a) {
        payload = request.query.payload;
        image = src_1.Api.getQrImage(payload);
        response.setHeader("Content-Type", "image/png");
        image.pipe(response);
        return [2 /*return*/];
    });
}); });
// handle payment update request
app.get("/handle-payment", function (request, response, _next) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log({
            query: request.query,
            body: request.body,
        }, "got handle payment update");
        response.send("pending");
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
server.listen(config.server.port, function () {
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
//# sourceMappingURL=index.js.map