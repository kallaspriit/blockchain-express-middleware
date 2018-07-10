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
var _1 = require("./");
var Blockchain_test_1 = require("./Blockchain.test");
var RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";
describe("Invoice", function () {
    it("should enable serialization and de-serialization", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice, serialized, deSerialized;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 1,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            serialized = invoice.toJSON();
            deSerialized = new _1.Invoice(serialized);
            expect(Blockchain_test_1.processInvoiceForSnapshot(invoice)).toMatchSnapshot();
            expect(Blockchain_test_1.processInvoiceForSnapshot(serialized)).toMatchSnapshot();
            expect(Blockchain_test_1.processInvoiceForSnapshot(deSerialized)).toEqual(invoice);
            return [2 /*return*/];
        });
    }); });
    it("should provide a static method for checking whether state transition is valid", function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.PENDING, _1.InvoicePaymentState.CONFIRMED)).toBe(true);
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.PENDING, _1.InvoicePaymentState.PENDING)).toBe(true);
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.PENDING, _1.InvoicePaymentState.WAITING_FOR_CONFIRMATION)).toBe(true);
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.PENDING, _1.InvoicePaymentState.CONFIRMED)).toBe(true);
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION, _1.InvoicePaymentState.CONFIRMED)).toBe(true);
            expect(_1.Invoice.isValidInvoiceStateTransition(_1.InvoicePaymentState.CONFIRMED, _1.InvoicePaymentState.PENDING)).toBe(false);
            return [2 /*return*/];
        });
    }); });
    it("should provide a static method for checking whether given state is complete", function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            expect(_1.Invoice.isCompleteState(_1.InvoicePaymentState.PENDING)).toBe(false);
            expect(_1.Invoice.isCompleteState(_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION)).toBe(false);
            expect(_1.Invoice.isCompleteState(_1.InvoicePaymentState.CONFIRMED)).toBe(true);
            return [2 /*return*/];
        });
    }); });
    it("should handle registering a new transaction and update existing transactions", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 1,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 0,
            });
            invoice.registerTransaction({
                hash: "yyy",
                amount: 1,
                confirmations: 0,
            });
            // update first
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 1,
            });
            expect(Blockchain_test_1.processInvoiceForSnapshot(invoice)).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    it("should throw if updating transaction with a different amount", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 1,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 0,
            });
            expect(function () {
                return invoice.registerTransaction({
                    hash: "xxx",
                    amount: 2,
                    confirmations: 1,
                });
            }).toThrowErrorMatchingSnapshot();
            return [2 /*return*/];
        });
    }); });
    it("should handle registering a new transaction and update existing transactions", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 1,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 0,
            });
            invoice.registerTransaction({
                hash: "yyy",
                amount: 2,
                confirmations: 0,
            });
            // tslint:disable-next-line:no-magic-numbers
            expect(invoice.getPaidAmount()).toEqual(3);
            return [2 /*return*/];
        });
    }); });
    it("should report amount state", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 5,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            invoice.registerTransaction({
                hash: "xxx",
                amount: 2,
                confirmations: 0,
            });
            expect(invoice.getAmountState()).toEqual(_1.InvoiceAmountState.UNDERPAID);
            invoice.registerTransaction({
                hash: "yyy",
                amount: 3,
                confirmations: 0,
            });
            expect(invoice.getAmountState()).toEqual(_1.InvoiceAmountState.EXACT);
            invoice.registerTransaction({
                hash: "zzz",
                amount: 1,
                confirmations: 0,
            });
            expect(invoice.getAmountState()).toEqual(_1.InvoiceAmountState.OVERPAID);
            return [2 /*return*/];
        });
    }); });
    it("should accept valid payment state updates", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 5,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            expect(invoice.getPaymentState()).toEqual(_1.InvoicePaymentState.PENDING);
            // no change
            invoice.setPaymentState(_1.InvoicePaymentState.PENDING);
            expect(invoice.getPaymentState()).toEqual(_1.InvoicePaymentState.PENDING);
            // valid transition
            invoice.setPaymentState(_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION);
            expect(invoice.getPaymentState()).toEqual(_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION);
            // can't go back to pending
            expect(function () { return invoice.setPaymentState(_1.InvoicePaymentState.PENDING); }).toThrowErrorMatchingSnapshot();
            return [2 /*return*/];
        });
    }); });
    it("should return valid signature", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 5,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            expect(invoice.getSignature("xxx")).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    it("should return whether current state is complete", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 5,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            expect(invoice.isComplete()).toBe(false);
            invoice.setPaymentState(_1.InvoicePaymentState.WAITING_FOR_CONFIRMATION);
            expect(invoice.isComplete()).toBe(false);
            invoice.setPaymentState(_1.InvoicePaymentState.CONFIRMED);
            expect(invoice.isComplete()).toBe(true);
            return [2 /*return*/];
        });
    }); });
    it("should return correct confirmation count", function () { return __awaiter(_this, void 0, void 0, function () {
        var invoice;
        return __generator(this, function (_a) {
            invoice = new _1.Invoice({
                dueAmount: 5,
                message: "Test",
                address: RECEIVING_ADDRESS,
            });
            expect(invoice.getConfirmationCount()).toBe(0);
            expect(invoice.hasSufficientConfirmations(2)).toBe(false);
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 0,
            });
            expect(invoice.getConfirmationCount()).toBe(0);
            expect(invoice.hasSufficientConfirmations()).toBe(false);
            invoice.registerTransaction({
                hash: "xxx",
                amount: 1,
                confirmations: 1,
            });
            expect(invoice.getConfirmationCount()).toBe(1);
            expect(invoice.hasSufficientConfirmations(1)).toBe(true);
            invoice.registerTransaction({
                hash: "yyy",
                amount: 1,
                confirmations: 0,
            });
            expect(invoice.getConfirmationCount()).toBe(0);
            expect(invoice.hasSufficientConfirmations()).toBe(false);
            invoice.registerTransaction({
                hash: "zzz",
                amount: 1,
                confirmations: 5,
            });
            expect(invoice.getConfirmationCount()).toBe(0);
            expect(invoice.hasSufficientConfirmations()).toBe(false);
            return [2 /*return*/];
        });
    }); });
});
//# sourceMappingURL=Invoice.test.js.map