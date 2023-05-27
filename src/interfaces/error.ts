export interface IErrorMiddleware extends TypeError {
    getHttpCode():number;
    getCode():number;
    getDetail():number;
}

export interface IErrorGeneric extends Error {
  code?:number;
}

export type errorTypeMiddleware = IErrorMiddleware;

export type errorGenericType = IErrorGeneric;
