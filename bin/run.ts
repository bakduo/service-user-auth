import { MongoConnect } from './../src/datastore/wmongo';
import { appconfig, loggerApp, loadUserDAO } from '../src/init/configure';
import { app } from '../src/main';

const puerto = appconfig.port || 8080;

const server = app.listen(puerto, async () => {

    await loadUserDAO();
    
    console.log(`servidor escuchando en http://localhost:${puerto}`);
});

server.on('error', error => {
    console.log('error en el servidor:', error);
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
                console.log("Close DB..");
                loggerApp.debug("Close DB..");
                process.exit(0);
            });

            // DB.getConnection().close(true,function(err:unknown){
            //     // console.log("Close DB..");
            //     // loggerApp.debug("Close DB..");
            //     // process.exit(err ? 1 : 0);
            // });
    }
    
    process.exit(0);

});