import { Connection, createConnection } from 'mongoose';

export interface IMongoConnect {
    getEnable():boolean;
    getConnection():Connection;
}

export class NoMongoConnect implements IMongoConnect {

    getConnection(): Connection {
        throw new Error('Method not implemented.');
    }

    getEnable(): boolean {
        return false;
    }
    
}

export class MongoConnect implements IMongoConnect {

    private url:string;

    private connection: Connection;

    private static instance: MongoConnect;

    private constructor(_url:string,_user:string,_pass:string,_dbname:string,_ssl:boolean){

        
            this.url = _url;
            this.connection = createConnection(this.url, {
                ssl: _ssl,
                dbName:_dbname,
                user:_user,
                pass:_pass,
                autoIndex: true
              });
    }

    getEnable(): boolean {
        return true;
    }

    public static getInstance(_url:string,_user:string,_pass:string,_dbname:string,_ssl:boolean,_enable:boolean): IMongoConnect {
        if (_enable){

            if (!MongoConnect.instance) {
                MongoConnect.instance = new MongoConnect(_url,_user,_pass,_dbname,_ssl);
            }
    
            return MongoConnect.instance;
        }

        return new NoMongoConnect();
        
    }
    
    getConnection():Connection{
        return this.connection;
    }
}
