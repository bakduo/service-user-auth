import { Sequelize } from 'sequelize'
import { appconfig } from '../init/configure';

export const configORM = (type:string) => {

   let AppDB;

    if (type==="sqlite"){
    
        AppDB = new Sequelize('app', '', '', {
            dialect: 'sqlite',
            logging: false,
            storage: appconfig.db.sql.config.sqlite.path
          });
    }

    return AppDB;
}