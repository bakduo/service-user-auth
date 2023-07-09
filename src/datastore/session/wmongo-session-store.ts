import { IConectionStoreSession, SessionStoreGeneric } from "./generic-session-store";
import MongoStore from 'connect-mongo'


export interface IMongoStoreSession extends IConectionStoreSession{
    url:string,
    secure:boolean
}

export class WMongoSessionStore extends SessionStoreGeneric {

    private url:string;
    private secure:boolean;
    private options: any;
    private store: MongoStore;

    constructor(_conection:IMongoStoreSession){
        super(_conection);
        //Use secret y cipher para las password
        this.url = _conection.url;
        this.secure = _conection.secure;
        if (this.secure){
            this.options = {useNewUrlParser: true, useUnifiedTopology:true,ssl:true};
        }else{
            this.options = {useNewUrlParser: true, useUnifiedTopology:true,ssl:false};
        }
        
        this.store = MongoStore.create({
            mongoUrl : this.url,
            mongoOptions: this.options,
        });

    }

    private getConnection():MongoStore{
        return this.store;
    }

    getStore(): any {
        return this.getConnection();
    }
}