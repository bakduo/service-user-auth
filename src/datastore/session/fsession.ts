import { WMongoSessionStore } from "./wmongo-session-store";
import { appconfig } from '../../init/configure';
import { SessionStoreGeneric, ISessionStoreGeneric } from './generic-session-store';

class NoStore extends SessionStoreGeneric {

    constructor(){

        super({host:'',port:-1});

        throw new Error("Not implement");
    }
}

export class FactorySession {

    
    public static getInstance():ISessionStoreGeneric {
      
      const type = appconfig.session.type;

      let store;

      switch (type) {
        case 'mongo':

            store = new WMongoSessionStore({
                host:appconfig.session.config.mongo.host,
                port:appconfig.session.config.mongo.port,
                url:appconfig.session.config.mongo.url,
                secure:appconfig.session.config.mongo.secure,
            });

          break;
      }

      if (store){
        return store;
      }

      return new NoStore();

    }

    
}