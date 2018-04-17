"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
/**
 * Invoice payment state enumeration.
 */
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
})(InvoicePaymentState = exports.InvoicePaymentState || (exports.InvoicePaymentState = {}));
/**
 * Invoice amount state enumeration.
 */
var InvoiceAmountState;
(function (InvoiceAmountState) {
    InvoiceAmountState["EXACT"] = "EXACT";
    InvoiceAmountState["OVERPAID"] = "OVERPAID";
    InvoiceAmountState["UNDERPAID"] = "UNDERPAID";
})(InvoiceAmountState = exports.InvoiceAmountState || (exports.InvoiceAmountState = {}));
/**
 * Represents an invoice.
 *
 * Note that the invoice expects amounts in satoshis.
 */
var Invoice = /** @class */ (function () {
    /**
     * Constructs the invoice.
     *
     * Accepts either the parameters required to create a new invoice or serialized invoice info.
     *
     * @param info Invoice constructor info or serialized invoice info
     */
    function Invoice(info) {
        /**
         * List of transactions associated with the invoice.
         */
        this.transactions = [];
        /**
         * List of invoice state transitions.
         */
        this.stateTransitions = [];
        /**
         * Invoice payment state.
         */
        this.paymentState = InvoicePaymentState.PENDING;
        // check whether we got the serialized info
        if (isSerializedInvoice(info)) {
            // de-serialize if data matching invoice interface is given
            this.dueAmount = info.dueAmount;
            this.message = info.message;
            this.address = info.address;
            this.createdDate = info.createdDate;
            this.updatedDate = info.updatedDate;
            this.transactions = info.transactions;
            this.stateTransitions = info.stateTransitions;
            this.paymentState = info.paymentState;
        }
        else {
            // otherwise create new invoice
            this.dueAmount = info.dueAmount;
            this.message = info.message;
            this.address = info.address;
            this.createdDate = new Date();
            this.updatedDate = new Date();
        }
    }
    /**
     * Returns invoice signature.
     *
     * The signature is used to verify that the update requests originate from the correct source.
     *
     * @param info Signature info
     * @param secret Secret used to generate the signature
     */
    Invoice.getInvoiceSignature = function (info, secret) {
        // build the signature payload
        var tokens = [info.dueAmount.toString(), info.message];
        var payload = tokens.join(":");
        // create a sha512 hash-based message authentication code digested as hex
        return crypto_1.createHmac("sha512", secret)
            .update(payload)
            .digest("hex");
    };
    /**
     * Returns whether requested state transition is valid.
     *
     * @param currentState Current invoice state
     * @param newState Requested invoice state
     */
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
    /**
     * Returns whether given invoice payment state is considered final.
     *
     * @param state Invoice payment state
     */
    Invoice.isCompleteState = function (state) {
        var completeStates = [InvoicePaymentState.CONFIRMED];
        return completeStates.indexOf(state) !== -1;
    };
    /**
     * Registers payment transaction.
     *
     * Updates existing transaction if one exists, otherwise adds a new one.
     *
     * @param transaction Transaction info
     */
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
    /**
     * Returns invoice paid amount.
     *
     * This is summed over all associated transactions.
     */
    Invoice.prototype.getPaidAmount = function () {
        return this.transactions.reduce(function (paidAmount, transaction) { return paidAmount + transaction.amount; }, 0);
    };
    /**
     * Returns payment amount state.
     *
     * The invoice might be under or overpaid.
     */
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
    /**
     * Returns invoice payment state.
     */
    Invoice.prototype.getPaymentState = function () {
        return this.paymentState;
    };
    /**
     * Sets new payment state.
     *
     * An error is thrown if requested state transition is not considered valid.
     *
     * @param newState New payment state
     */
    Invoice.prototype.setPaymentState = function (newState) {
        // ignore no state change
        if (newState === this.paymentState) {
            return;
        }
        // throw error if invalid state transition is requested
        if (!this.isValidStateTransition(newState)) {
            throw new Error("Invalid state transition from \"" + this.paymentState + "\" to \"" + newState + "\"");
        }
        // register the state transition
        this.stateTransitions.push({
            previousState: this.paymentState,
            newState: newState,
            date: new Date(),
        });
        // update the invoice payment state
        this.paymentState = newState;
        this.updatedDate = new Date();
    };
    /**
     * Returns invoice signature.
     *
     * @param secret Secret passphrase
     */
    Invoice.prototype.getSignature = function (secret) {
        return Invoice.getInvoiceSignature(this, secret);
    };
    /**
     * Returns whether state transition to provided state would be valid.
     *
     * @param newState New state to consider
     */
    Invoice.prototype.isValidStateTransition = function (newState) {
        return Invoice.isValidInvoiceStateTransition(this.paymentState, newState);
    };
    /**
     * Returns whether the invoice is complete.
     *
     * Complete invoices to not get any more updates.
     */
    Invoice.prototype.isComplete = function () {
        return Invoice.isCompleteState(this.paymentState);
    };
    /**
     * Returns the number of confirmations.
     *
     * The returned confirmation count is the minimum of all registered transactions and zero if none have been added.
     */
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
    /**
     * Returns whether the invoice has sufficient confirmations.
     *
     * This means that the associated transactions with the lowest number of confirmations needs to match this.
     *
     * @param requiredConfirmationCount Required confirmation count
     */
    Invoice.prototype.hasSufficientConfirmations = function (requiredConfirmationCount) {
        if (requiredConfirmationCount === void 0) { requiredConfirmationCount = 3; }
        return this.getConfirmationCount() >= requiredConfirmationCount;
    };
    /**
     * Returns serialized invoice info.
     *
     * The information returned by this method can be passed into the constructor to de-serialize the invoice.
     */
    Invoice.prototype.toJSON = function () {
        return {
            dueAmount: this.dueAmount,
            message: this.message,
            address: this.address,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate,
            transactions: this.transactions,
            stateTransitions: this.stateTransitions,
            paymentState: this.getPaymentState(),
        };
    };
    return Invoice;
}());
exports.default = Invoice;
/**
 * Returns whether given information likely matches serialized invoice interface.
 */
// tslint:disable-next-line:no-any
function isSerializedInvoice(info) {
    return info.paymentState !== undefined;
}
//# sourceMappingURL=Invoice.js.map