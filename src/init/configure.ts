import config from 'config';
import pino from "pino";
import stream from 'stream';
import childProcess from 'child_process';
import { IGenericDB, FUserDAO, FTokenDAO } from '../dao';
import { initMUserRemoteInstance } from '../dao/sequelize/suser-remote-orm';
import { configORM } from '../datastore/wsql';
import { errorGenericType } from '../interfaces/error';
import { FactorySession } from '../datastore/session/fsession';
import { ISessionStoreGeneric } from '../datastore/session/generic-session-store';
import { IToken, IUser } from '../interfaces';
import { MQservice } from '../services';

const logThrough = new stream.PassThrough();

// Environment variables
const cwd = process.cwd();
const { env } = process;
const logPath = cwd + '/log';

const child = childProcess.spawn(
    process.execPath,
    [
      require.resolve('pino-tee'),
      'warn',
      `${logPath}/log.warn.log`,
      'error',
      `${logPath}/log.error.log`,
      'info',
      `${logPath}/log.info.log`,
      'debug',
      `${logPath}/log.debug.log`,
    ],
    { cwd, env }
  );
  
logThrough.pipe(child.stdin);

export const loggerApp = pino(
{
    name: 'service-user',
    level: 'debug'
},
logThrough
);

export const ERRORS_APP = {
    'EInvalidCredential':{
        detail:'User or password invalid',
        code:1000,
        HttpStatusCode: 401
    },
    'ETokenInvalid':{
        detail:'Token invalid',
        code:1001,
        HttpStatusCode: 403
    },
    'ERequestInvalid':{
        detail:'Request invalid',
        code: 1002,
        HttpStatusCode: 400
    },
    'EInvalidUserRepited':{
        detail:'The user thats exists',
        code: 1003,
        HttpStatusCode: 400
    },
    'EInvalidUser':{
        detail:'Invalid user or password',
        code: 1004,
        HttpStatusCode: 401
    },
    'EInvalidUserForCreation':{
        detail:'Invalid user body',
        code: 1005,
        HttpStatusCode: 400
    },
    'ESaveUser':{
        detail:'Exception on save user into datastore',
        code: 1006,
        HttpStatusCode: 500
    },
    'EFindUser':{
        detail:'Exception on findone on datastore',
        code: 1007,
        HttpStatusCode: 500
    },
    'EUpdatePasswd':{
        detail:'Exception on update passswd on datastore',
        code: 1008,
        HttpStatusCode: 500
    },
    'EBase':{
        detail:'Exception generic',
        code: 999,
        HttpStatusCode: 500
    },
}


export interface IEntityAutoORM {
    [key:string]:string;
    value:string
}

interface IConfigDB {
    db:{
        sql:{
            config:{
              mysql:{
                username:string,
                passwd:string,
                port:number,
                host:string,
                database:string
              },
              postgres:{
                username:string,
                passwd:string,
                port:number,
                host:string,
                database:string
              },
              sqlite:{
                database:string,
                path:string
              }
            }
        },
        mongo:{
            urlreplica:string;
            url:string;
            dbname:string;
            host:string;
            user:string;
            password:string;
            secure:boolean;
            port:number;
        }
    },
    jwt:{
        secretRefresh:string;
        secret: string;
        session: boolean;
        timeToken:string;
    },
    port:number;
    hostname:string;
    secure:boolean;
    protocol:string;
    logpath:string;
    persistence:{
        replicaset:boolean;
        transaction:boolean;
        type:[IEntityAutoORM];
        mongo:boolean;
        memory:boolean;
        sql:boolean;
    },
    keycloak:{
        enabled:boolean,
        clientId: string,
        bearerOnly: boolean,
        serverUrl: string,
        realm: string,
        credentials: {
            secret: string
        }
    },
    session:{
        type:string;
        secret:string,
        config:{
            mongo:{
                urlreplica:string;
                url:string;
                dbname:string;
                host:string;
                user:string;
                password:string;
                secure:boolean;
                port:number;
            }
        }
    },
    message:{
        enable:boolean,
        rabbitmq:boolean,
        server:string,
        port:number,
        vhost:string,
        username:string,
        password:string,
        exchname:string,
        queuename:string,
        routerkey:string,
    }

}

export const appconfig:IConfigDB = config.get('app');

export let userDAO:IGenericDB<IUser>;
export let tokenDAO:IGenericDB<IToken>;

const isDev = process.env.NODE_ENV === 'development';

export const sessionStore:ISessionStoreGeneric = FactorySession.getInstance();

export const loadUserDAO = async () =>{

    const waiting = appconfig.persistence.type.map(async (item:IEntityAutoORM)=>{

        const {key,value} = item;

        switch (value) {

            case "sqlite" || "mysql" || "postgress":
            
                switch (key) {

                    case "userremote":

                        try {

                            const AppDB = configORM(value);

                            if (AppDB){
                                
                                initMUserRemoteInstance(AppDB);

                                await AppDB.sync({force:isDev});
                            }
    
                        } catch (error) {
                            const err = error as errorGenericType;
                            loggerApp.error(`Exception on constructor into ORM: ${err.message}`);
                            throw new Error(`Error to Generated ORMUserRemote: ${err.message}`);
                        }
                             
                        userDAO = FUserDAO.getInstance(value).build();

                        break;
                }

                break;

            case "mongo":
                switch (key) {
                    case "token":
                        tokenDAO = FTokenDAO.getInstance(value).build();
                        break;
                    case "userremote":
                        userDAO = FUserDAO.getInstance(value).build();
                        break;
                    default:
                        break;
                }
                break;
        }
    });
    await Promise.all(waiting);
}

export const loadMessageBroker = async () =>{
    const mqs = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
    await mqs.connect(appconfig.message.server,appconfig.message.port,appconfig.message.vhost,appconfig.message.username,appconfig.message.password);
    await mqs.getChannel();
    await mqs.configureChannel();
}