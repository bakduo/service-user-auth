
import { Model, Connection } from 'mongoose';
import { IMongoConnect } from '../datastore';
import { loggerApp } from '../init';
import { errorGenericType, IKeyValue, IToken } from '../interfaces';
import { SchemaToken } from '../schemas';
import { IGenericDB, IsearchItem } from './generic';

export class NoToken implements IToken {

    token: string;
    date: number;
    timestamp: number;
    tmptoken: string;
    email?: string;
    username?: string;
    refreshToken: string;

    constructor(){
        this.token = '';
        this.date = -1;
        this.timestamp = -1;
        this.tmptoken = '';
        this.email = '';
        this.refreshToken = '';
        this.username = '';
    }
}

//export class MongoTokenDao implements IGenericDB<ITokenDTO> {
export class MongoTokenDao implements IGenericDB<IToken> {

    model: Model<IToken>;

    private static instance: MongoTokenDao;

    private constructor(_connection:Connection){
        try {

            this.model = _connection.model<IToken>('Token',SchemaToken);

        } catch (error:unknown) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on constructor into MongoTokenDao: ${err.message}`);
            throw new Error("Error to Generated MongoTokenDao");
        }
    }

    public static getInstance(mongoconnect:IMongoConnect): MongoTokenDao {
        if (!MongoTokenDao.instance) {
            MongoTokenDao.instance = new MongoTokenDao(mongoconnect.getConnection());
        }

        return MongoTokenDao.instance;
    }

    //async findOne (custom: IsearchItem):Promise<ITokenDTO> {
    async findOne (custom: IsearchItem):Promise<IToken> {

        const {keycustom, valuecustom} = custom;

        const queryObj:IKeyValue = {};

        queryObj[keycustom] = valuecustom;

        try {
            const item = await this.model.findOne(queryObj) || false;
            
            if (item){
                const {token,tmptoken,refreshToken,email,username,timestamp} = item;
    
                return {token,tmptoken,refreshToken,email,username,timestamp};
            }    
        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on findOne ${err.message}`);
        }

        return new NoToken();
    }

    async deleteOne(custom: IsearchItem): Promise<boolean> {

        const {keycustom, valuecustom} = custom;

        const queryObj:IKeyValue = {};

        queryObj[keycustom] = valuecustom;

        try {
            const item = await this.model.deleteOne(queryObj);

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

    //async saveOne(item: ITokenDTO): Promise<ITokenDTO>{
    async saveOne(item: IToken): Promise<IToken>{

            try {

                const mItem = {
                    date:Math.floor(Date.now()/1000),
                    ...item
                }

                const newItem:IToken = await this.model.create(mItem);

                if (newItem){
                   
                    const {token,email,refreshToken,tmptoken,username,timestamp} = newItem;

                    return {token,email,tmptoken,refreshToken,username,timestamp};

                }    
                
                throw new Error(`Exception on create into MongoDB`);

            } catch (error:unknown) {
                const err = error as errorGenericType;
                loggerApp.error(`Exception on saveOne into MongoDB: ${err.message}`);
                throw new Error(`Exception on saveOne into MongoDB ${err.message}`);
            }
    }

    //async getAll(): Promise<ITokenDTO[]|[]> {
        async getAll(): Promise<IToken[]|[]> {
        
        const allItems = await this.model.find();
        if (allItems){
            return allItems.map((item)=> {
                const {token,email,date,refreshToken,tmptoken,username,timestamp}  = item;

                return {token,email,date,tmptoken,refreshToken,username,timestamp};
            });
        }

        return [];
    }

    //async updateOne(token: string, item: ITokenDTO): Promise<ITokenDTO> {
    async updateOne(token: string, item: IToken): Promise<IToken> {

        const mItem = {
            date:Math.floor(Date.now()/1000),
            ...item
        }

        const existe = await this.model.findOne({"token":token});

        if (existe){

            const updateItem = await this.model.findByIdAndUpdate(existe._id,mItem);

            try {
                if (updateItem){
                
                    const {token,email,refreshToken,tmptoken,username,timestamp} = updateItem;
    
                    return {token,email,tmptoken,refreshToken,username,timestamp};
                }
            } catch (error) {
                const err = error as errorGenericType;
                loggerApp.error(`Exception on updateOne into MongoDB: ${err.message}`);
                throw new Error(`Exception on updateOne into MongoDB ${err.message}`);
            }
        }
        
        return new NoToken();
    
}

    async deleteAll(): Promise<void> {
        await this.model.deleteMany({});
    }

}