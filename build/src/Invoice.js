"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
// invoice state
var InvoiceState;
(function (InvoiceState) {
    // invoice has been created but no payment updates have been received
    InvoiceState["PENDING"] = "PENDING";
    // invoice has been paid but not yet confirmed, waiting for required confirmations
    // note that it may have been under- or overpaid, check the amounts
    InvoiceState["PAID"] = "PAID";
    // invoice has been paid and received sufficient confirmations
    // note that it may have been under- or overpaid, check the amounts
    InvoiceState["CONFIRMED"] = "CONFIRMED";
    // x EXPIRED
    // x PAID_EXPIRED
    // TODO: handle expiry?
    // x PAID_EXPIRED = "PAID_EXPIRED",
    // x EXPIRED = "EXPIRED",
    // x CANCELLED = "CANCELLED",
    // x FAILED = "FAILED",
})(InvoiceState = exports.InvoiceState || (exports.InvoiceState = {}));
var Invoice = /** @class */ (function () {
    function Invoice(_a) {
        var id = _a.id, dueAmount = _a.dueAmount, message = _a.message;
        // public amountPaid = 0;
        // public confirmations = 0;
        this.state = InvoiceState.PENDING;
        this.transactions = [];
        this.id = id;
        this.dueAmount = dueAmount;
        this.message = message;
    }
    // TODO: created, updated, paid date
    // TODO: expiry date?
    // TODO: state transitions
    Invoice.getInvoiceSignature = function (info, key) {
        var tokens = [info.id, info.dueAmount.toString(), info.message];
        var payload = tokens.join(":");
        return crypto_1.createHmac("sha512", key)
            .update(payload)
            .digest("hex");
    };
    Invoice.isValidInvoiceStateTransition = function (currentState, newState) {
        // allow not changing the state
        if (currentState === newState) {
            return true;
        }
        // map of current to possible new states
        var validTransitionsMap = (_a = {},
            _a[InvoiceState.PENDING] = [InvoiceState.PAID, InvoiceState.CONFIRMED],
            _a[InvoiceState.PAID] = [InvoiceState.CONFIRMED],
            _a[InvoiceState.CONFIRMED] = [],
            _a);
        // valid transitions for current state
        var validTransitions = validTransitionsMap[currentState];
        // throw error if mapping is missing for some reason
        /* istanbul ignore if */
        if (!validTransitions) {
            throw new Error("Valid state transitions mapping for \"" + currentState + "\" is missing, this should not happen");
        }
        // transition is valid if the new state is in the valid transitions list
        return validTransitions.indexOf(newState) !== -1;
        var _a;
    };
    Invoice.isCompleteState = function (state) {
        var completeStates = [InvoiceState.CONFIRMED];
        return completeStates.indexOf(state) !== -1;
    };
    Invoice.prototype.registerTransaction = function (transaction) {
        // attempt to find existing transaction with the same hash
        var existingTransaction = this.transactions.find(function (item) { return item.hash === transaction.hash; });
        if (existingTransaction !== undefined) {
            // make sure the amount is the same
            if (existingTransaction.amount !== transaction.amount) {
                throw new Error("Invoice \"" + this.id + "\" existing transaction \"" + existingTransaction.hash + "\" amount of " + existingTransaction.amount + " is different from the new amount of " + transaction.amount + ", this should not happen");
            }
            // update existing transaction
            existingTransaction.confirmations = transaction.confirmations;
        }
    };
    Invoice.prototype.getPaidAmount = function () {
        return this.transactions.reduce(function (paidAmount, transaction) { return paidAmount + transaction.amount; }, 0);
    };
    Invoice.prototype.getSignature = function (key) {
        return Invoice.getInvoiceSignature(this, key);
    };
    Invoice.prototype.isValidStateTransition = function (newState) {
        return Invoice.isValidInvoiceStateTransition(this.state, newState);
    };
    Invoice.prototype.isComplete = function () {
        return Invoice.isCompleteState(this.state);
    };
    Invoice.prototype.hasSufficientConfirmations = function (requiredConfirmationCount) {
        // if any of the transactions have less than required confirmations then return false
        for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
            var transaction = _a[_i];
            if (transaction.confirmations < requiredConfirmationCount) {
                return false;
            }
        }
        // all transactions have sufficient confirmations
        return true;
    };
    return Invoice;
}());
exports.default = Invoice;
//# sourceMappingURL=Invoice.js.map