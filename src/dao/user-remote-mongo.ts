import { Model, Connection } from 'mongoose';
import { IMongoConnect } from '../datastore';
import { loggerApp, appconfig } from '../init';
import { errorGenericType, IKeyValue, IPasswordUser, IUser, NoUserRemote, TDeletedMongo } from '../interfaces';
import { SchemaUserRemote } from '../schemas';
import { IsearchItem, IGenericDB, IGPassword } from './generic';
import { IUserRemote } from './Iuser-remote';

//export class MongoUserPassword implements IPassword<IPasswordDTO> {
export class MongoUserPassword implements IGPassword<IPasswordUser> {

    model: MongoUserRemoteDao;

    constructor(user:MongoUserRemoteDao){
        this.model = user;
    }

    //async findPassword (custom: IsearchItem):Promise<IPasswordDTO> {
    async findPassword (custom: IsearchItem):Promise<IPasswordUser> {

       const user  = await this.model.findOne(custom);

       if (user){
        return user;
       }

       throw new Error(`Exception on findPassword into MongoDB`);
    }
}

//export class MongoUserRemoteDao implements IGenericDB<IUserDTO> {
export class MongoUserRemoteDao implements IGenericDB<IUser> {
    
    model: Model<IUserRemote>;

    private static instance: MongoUserRemoteDao;
    private supportTransaction:boolean;
    private connnectionMongo:Connection;
    

    private constructor(_connection:Connection,transaction:boolean){
        try {

            if (MongoUserRemoteDao.instance){
                throw new Error("Not permit double instance MongoUserRemoteDao");
            }

            this.model = _connection.model<IUserRemote>('UserRemote',SchemaUserRemote);
            this.supportTransaction = transaction;
            this.connnectionMongo = _connection;
        

        } catch (error:unknown) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on constructor into MongoDB: ${err.message}`);
            throw new Error("Error to Generated MongoUserRemoteDao");
        }
    }

    getType(): string {
        return "mongo";
    }

    public static getInstance(mongoconnect:IMongoConnect): MongoUserRemoteDao {
        if (!MongoUserRemoteDao.instance) {
            MongoUserRemoteDao.instance = new MongoUserRemoteDao(mongoconnect.getConnection(),appconfig.persistence.transaction);
        }

        return MongoUserRemoteDao.instance;
    }

    //async findOne (custom: IsearchItem):Promise<IUserDTO> {
    async findOne (custom: IsearchItem):Promise<IUser> {

        const {keycustom, valuecustom} = custom;

        const queryObj:IKeyValue = {};

        queryObj[keycustom] = valuecustom;

        try {

            let item:IUserRemote | false;

            if (this.supportTransaction){
                const session = await this.connnectionMongo.startSession();
                session.startTransaction();
                item = await this.model.findOne(queryObj).session(session) || false;
                session.endSession();
            }else{
                item = await this.model.findOne(queryObj) || false;
            }

            if (item){
                const {email,deleted,username,password,roles} = item;
    
                return {email,deleted,username,password,roles};
            }

        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on findOne ${err.message}`);
        }

        return new NoUserRemote();
    }

    async deleteOne(custom: IsearchItem): Promise<boolean> {

        const {keycustom, valuecustom} = custom;

        const queryObj:IKeyValue = {};

        queryObj[keycustom] = valuecustom;

        try {
            
            let item:TDeletedMongo;

            if (this.supportTransaction){
                const session = await this.connnectionMongo.startSession();
                session.startTransaction();
                item = await this.model.deleteOne(queryObj).session(session);
                await session.commitTransaction();
                session.endSession();
            }else{
                item = await this.model.deleteOne(queryObj);
            }

            if (item){
                if (item.deletedCount>0){
                    return true
                }
            }    
        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on deleteOne ${err.message}`);
        }
      
        return false;
    }

    //async saveOne(item: IUserDTO): Promise<IUserDTO>{
    async saveOne(item: IUser): Promise<IUser>{

            try {

                const mItem = {
                    timestamp:Math.floor(Date.now()/1000),
                    ...item
                }

                let newItem:IUserRemote[];

                let newItemSingle:IUserRemote;

                if (this.supportTransaction){
                    const session = await this.connnectionMongo.startSession();
                    session.startTransaction();
                    newItem = await this.model.create([mItem],{session:session});
                    await session.commitTransaction();
                    session.endSession();
                    if (newItem){
                        const {email,deleted,username,password,roles} = newItem[0];
                        return {email,deleted,username,password,roles};
                    }
                }else{
                    newItemSingle = await this.model.create(mItem);
                    if (newItemSingle){
                        const {email,deleted,username,password,roles} = newItemSingle;
                        return {email,deleted,username,password,roles};
                    }
                }

                throw new Error(`Exception on create into MongoDB`);

            } catch (error:unknown) {
                const err = error as errorGenericType;
                loggerApp.error(`Exception on saveOne into MongoDB: ${err.message}`);
                throw new Error(`Exception on saveOne into MongoDB ${err.message} `);
            }
    }

    //async getAll(): Promise<IUserDTO[]|[]> {
    async getAll(): Promise<IUser[]|[]> {
        
        const allItems = await this.model.find();
        if (allItems){
            return allItems.map((item)=> {
                const {email,deleted,username,password,roles}  = item;

                return {email,deleted,username,password,roles};
            });
        }

        return [];
    }

    //async updateOne(email: string, item: IUserDTO): Promise<IUserDTO> {
    async updateOne(email: string, item: IUser): Promise<IUser> {

            const mItem = {
                timestamp:Math.floor(Date.now()/1000),
                ...item
            }

            let existe:IUserRemote | false;
            let updateItem:IUserRemote | false;

            if (this.supportTransaction){

                try {

                    const session = await this.connnectionMongo.startSession();
    
                    session.startTransaction();
    
                    existe = await this.model.findOne({"email":email}).session(session) || false;
    
                    if (existe){
        
                        updateItem = await this.model.findByIdAndUpdate(existe._id,mItem).session(session) || false;
    
                        await session.commitTransaction();
    
                        session.endSession();

                        if (updateItem){
                                    
                            const {email,deleted,username,password,roles} = updateItem;
            
                            return {email,deleted,username,password,roles};
                        }
        
                    }

                } catch (error) {
                    const err = error as errorGenericType;
                    loggerApp.error(`Exception on updateOne into MongoDB: ${err.message}`);
                    throw new Error(`Exception on updateOne into MongoDB ${err.message}`);
                }

            }else{

                try {

                    existe = await this.model.findOne({"email":email}) || false;

                    if (existe){   

                        updateItem = await this.model.findByIdAndUpdate(existe._id,mItem) || false;

                        if (updateItem){
                                    
                            const {email,deleted,username,password,roles} = updateItem;
            
                            return {email,deleted,username,password,roles};
                        }
                    }

                } catch (error) {
                    const err = error as errorGenericType;
                    loggerApp.error(`Exception on updateOne into MongoDB: ${err.message}`);
                    throw new Error(`Exception on updateOne into MongoDB ${err.message}`);
                }
            }
            
            return new NoUserRemote();
        
    }

    async deleteAll(): Promise<void> {
        await this.model.deleteMany({});
    }

}
