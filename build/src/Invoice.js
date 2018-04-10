"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
// invoice payment state
var InvoicePaymentState;
(function (InvoicePaymentState) {
    // invoice has been created but no payment updates have been received
    InvoicePaymentState["PENDING"] = "PENDING";
    // invoice has been paid but not yet confirmed, waiting for required confirmations
    // note that it may have been under- or overpaid, check the amounts
    InvoicePaymentState["WAITING_FOR_CONFIRMATION"] = "WAITING_FOR_CONFIRMATION";
    // invoice has been paid and received sufficient confirmations
    // note that it may have been under- or overpaid, check the amounts
    InvoicePaymentState["CONFIRMED"] = "CONFIRMED";
    // x EXPIRED
    // x PAID_EXPIRED
    // TODO: handle expiry?
    // x PAID_EXPIRED = "PAID_EXPIRED",
    // x EXPIRED = "EXPIRED",
    // x CANCELLED = "CANCELLED",
    // x FAILED = "FAILED",
})(InvoicePaymentState = exports.InvoicePaymentState || (exports.InvoicePaymentState = {}));
// invoice amount state
var InvoiceAmountState;
(function (InvoiceAmountState) {
    InvoiceAmountState["EXACT"] = "EXACT";
    InvoiceAmountState["OVERPAID"] = "OVERPAID";
    InvoiceAmountState["UNDERPAID"] = "UNDERPAID";
})(InvoiceAmountState = exports.InvoiceAmountState || (exports.InvoiceAmountState = {}));
// tslint:disable-next-line:no-any
function isInvoiceInterface(info) {
    return info.paymentState !== undefined;
}
var Invoice = /** @class */ (function () {
    function Invoice(info) {
        this.transactions = [];
        this.paymentState = InvoicePaymentState.PENDING;
        if (isInvoiceInterface(info)) {
            // de-serialize if data matching invoice interface is given
            this.dueAmount = info.dueAmount;
            this.message = info.message;
            this.address = info.address;
            this.transactions = info.transactions;
            this.createdDate = info.createdDate;
            this.updatedDate = info.updatedDate;
            this.paymentState = info.paymentState;
        }
        else {
            // create new interface info otherwise
            this.dueAmount = info.dueAmount;
            this.message = info.message;
            this.address = info.address;
            this.createdDate = new Date();
            this.updatedDate = new Date();
        }
    }
    // TODO: expiry date?
    // TODO: state transitions
    Invoice.getInvoiceSignature = function (info, secret) {
        var tokens = [info.dueAmount.toString(), info.message];
        var payload = tokens.join(":");
        return crypto_1.createHmac("sha512", secret)
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
            _a[InvoicePaymentState.PENDING] = [InvoicePaymentState.WAITING_FOR_CONFIRMATION, InvoicePaymentState.CONFIRMED],
            _a[InvoicePaymentState.WAITING_FOR_CONFIRMATION] = [InvoicePaymentState.CONFIRMED],
            _a[InvoicePaymentState.CONFIRMED] = [],
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
        var completeStates = [InvoicePaymentState.CONFIRMED];
        return completeStates.indexOf(state) !== -1;
    };
    Invoice.prototype.registerTransaction = function (transaction) {
        // update updated date
        this.updatedDate = new Date();
        // attempt to find existing transaction with the same hash
        var existingTransaction = this.transactions.find(function (item) { return item.hash === transaction.hash; });
        // update existing transaction if it exists
        if (existingTransaction !== undefined) {
            // make sure the amount is the same
            if (existingTransaction.amount !== transaction.amount) {
                throw new Error("Invoice \"" + this.address + "\" existing transaction \"" + existingTransaction.hash + "\" amount of " + existingTransaction.amount + " is different from the new amount of " + transaction.amount + ", this should not happen");
            }
            // update existing transaction
            existingTransaction.confirmations = transaction.confirmations;
            existingTransaction.updatedDate = new Date();
            return;
        }
        // transaction does not exist, add a new one
        this.transactions.push(transaction);
    };
    Invoice.prototype.getPaidAmount = function () {
        return this.transactions.reduce(function (paidAmount, transaction) { return paidAmount + transaction.amount; }, 0);
    };
    Invoice.prototype.getAmountState = function () {
        var paidAmount = this.getPaidAmount();
        var dueAmount = this.dueAmount;
        if (paidAmount > dueAmount) {
            return InvoiceAmountState.OVERPAID;
        }
        else if (paidAmount < dueAmount) {
            return InvoiceAmountState.UNDERPAID;
        }
        return InvoiceAmountState.EXACT;
    };
    Invoice.prototype.getPaymentState = function () {
        return this.paymentState;
    };
    Invoice.prototype.setPaymentState = function (newState) {
        // ignore no state change
        if (newState === this.paymentState) {
            return;
        }
        // throw error if invalid state transition is requested
        if (!this.isValidStateTransition(newState)) {
            throw new Error("Invalid state transition from \"" + this.paymentState + "\" to \"" + newState + "\"");
        }
        // update the invoice payment state
        this.paymentState = newState;
        this.updatedDate = new Date();
    };
    Invoice.prototype.getSignature = function (key) {
        return Invoice.getInvoiceSignature(this, key);
    };
    Invoice.prototype.isValidStateTransition = function (newState) {
        return Invoice.isValidInvoiceStateTransition(this.paymentState, newState);
    };
    Invoice.prototype.isComplete = function () {
        return Invoice.isCompleteState(this.paymentState);
    };
    Invoice.prototype.getConfirmationCount = function () {
        // consider lack of transactions as zero confirmations
        if (this.transactions.length === 0) {
            return 0;
        }
        // start at positive infinity
        var minimumConfirmationCount = Infinity;
        // find the minimum confirmation count
        for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
            var transaction = _a[_i];
            if (transaction.confirmations < minimumConfirmationCount) {
                minimumConfirmationCount = transaction.confirmations;
            }
        }
        return minimumConfirmationCount;
    };
    Invoice.prototype.hasSufficientConfirmations = function (requiredConfirmationCount) {
        return this.getConfirmationCount() >= requiredConfirmationCount;
    };
    Invoice.prototype.toJSON = function () {
        return {
            dueAmount: this.dueAmount,
            message: this.message,
            address: this.address,
            transactions: this.transactions,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate,
            paymentState: this.getPaymentState(),
        };
    };
    return Invoice;
}());
exports.default = Invoice;
//# sourceMappingURL=Invoice.js.map