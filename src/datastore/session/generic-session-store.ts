
export interface IConectionStoreSession {
    host:string,
    port:number
}

export interface ISessionStoreGeneric {
    setHost(host:string):void;
    setPort(port:number):void;
    getHost():string;
    getPort():number;
    getStore():any;
}

export class SessionStoreGeneric implements ISessionStoreGeneric{

    private host:string;
    private port:number;

    constructor(_conection:IConectionStoreSession){
        this.host=_conection.host;
        this.port=_conection.port;
    }

    getStore() {
        throw new Error("Method not implemented.");
    }

    setHost(host:string):void{
        this.host = host;
    }

    setPort(port:number):void{
        this.port = port;
    }

    getHost():string{
        return this.host;
    }

    getPort():number{
        return this.port;
    }
}