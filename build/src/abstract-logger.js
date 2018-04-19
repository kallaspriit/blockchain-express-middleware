"use strict";
// TODO: create a npm library
Object.defineProperty(exports, "__esModule", { value: true });
// dummy log that does not do anything
/* istanbul ignore next */
exports.dummyLogger = {
    trace: function (_message) {
        var _optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _optionalParams[_i - 1] = arguments[_i];
        }
        /* dummy */
    },
    debug: function (_message) {
        var _optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _optionalParams[_i - 1] = arguments[_i];
        }
        /* dummy */
    },
    info: function (_message) {
        var _optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _optionalParams[_i - 1] = arguments[_i];
        }
        /* dummy */
    },
    warn: function (_message) {
        var _optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _optionalParams[_i - 1] = arguments[_i];
        }
        /* dummy */
    },
    error: function (_message) {
        var _optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _optionalParams[_i - 1] = arguments[_i];
        }
        /* dummy */
    },
};
/* tslint:enable:no-any prefer-function-over-method */
//# sourceMappingURL=abstract-logger.js.map