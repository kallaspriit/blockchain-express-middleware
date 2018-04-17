/* tslint:disable:no-any prefer-function-over-method */
export interface ILogger {
  trace(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  [x: string]: any;
}

// dummy log that does not do anything
export const dummyLogger: ILogger = {
  trace: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
  debug: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
  info: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
  warn: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
  error: (_message?: any, ..._optionalParams: any[]) => {
    /* dummy */
  },
};
/* tslint:enable:no-any prefer-function-over-method */
