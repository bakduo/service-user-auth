import { MongoConnect } from './../src/datastore/wmongo';
import { appconfig, loggerApp, loadUserDAO, loadMessageBroker } from '../src/init/configure';
import { app } from '../src/main';
import {MQservice} from '../src/services'


const puerto = appconfig.port || 8080;

const server = app.listen(puerto, async () => {

    await loadUserDAO();

    await loadMessageBroker();
    
    loggerApp.debug(`servidor escuchando en http://localhost:${puerto}`);
});

server.on('error', error => {
    
    loggerApp.debug(`Error server:${error.message}`);
    
});


process.on('SIGINT', function() {

    if (appconfig.persistence.mongo){

        const DB = MongoConnect.getInstance(
            appconfig.db.mongo.url,
            appconfig.db.mongo.user,
            appconfig.db.mongo.password,
            appconfig.db.mongo.dbname,
            appconfig.db.mongo.secure,
            appconfig.persistence.mongo);
            DB.getConnection().close(true)
            .then(()=>{
               loggerApp.error("Close DB..");
            })
            .catch((error)=>{
               loggerApp.error(`Error mongo close DB..${error}`);
            });
    }

    const mq = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);

    mq.closeChannel()
    .then(()=>{
        mq.closeConnection()
        .then(()=>{
            process.exit(0);
        })
        .catch((error)=>{
            loggerApp.error(`Error al cerrar conexión de mq..${error}`);
            process.exit(1);
        })
    })
    .catch((error)=>{
        loggerApp.error(`Error al cerrar canal de mq..${error}`);
        process.exit(1);
    });

});