//import { Entity, PrimaryGeneratedColumn, Column, Index, EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { loggerApp, appconfig } from "../init"
import { errorGenericType, NoUserRemote, IKeyValue, IUser } from "../interfaces"
import { IGenericDB, IsearchItem } from "./generic"
import { MUserRemoteInstance } from './sequelize/suser-remote-orm';

//export class ORMUserRemote implements IGenericDB<IUserDTO> {
export class ORMUserRemote implements IGenericDB<IUser> {

    private static instance: ORMUserRemote;
    private transaction:boolean;

    private constructor(_transaction:boolean){
        try {

            if (ORMUserRemote.instance){
                throw new Error("Not permit double instance MongoUserRemoteDao");
            }

           this.transaction = _transaction;
        
        } catch (error:unknown) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on constructor into ORM: ${err.message}`);
            throw new Error("Error to Generated ORMUserRemote");
        }
    }

    //async updateOne(id: string, item: IUserDTO): Promise<IUserDTO> {
    async updateOne(id: string, item: IUser): Promise<IUser> {
        try {

            //const updateItem = await MUserRemoteInstance.findOne({ where: { email: id } });

            //if (updateItem){

                const {email,deleted,username,password,roles} = item;

                let temp='';

                roles.map((item)=> temp = temp + item + ',');

                const updateResult = await MUserRemoteInstance.update({email,deleted,username,password,roles:temp},{
                    where: {
                        email: id
                      }
                });

                if (updateResult){
                    //return updateResult
                    return item;
                }
            //}

            return new NoUserRemote();

        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on findOne ${err.message}`);
        }

    }

    async deleteAll(): Promise<void> {
        try {

            await MUserRemoteInstance.truncate();

        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on findOne ${err.message}`); 
        }
    }

    getType(): string {
        return "sql";
    }

   static getInstance(): ORMUserRemote {

        if (!ORMUserRemote.instance) {

            try {
                ORMUserRemote.instance = new ORMUserRemote(appconfig.persistence.transaction);    
            } catch (error) {
                const err = error as errorGenericType;
                throw new Error(`Exception on getInstance ${err.message}`); 
            }
            
            
        }
        return ORMUserRemote.instance;
    }

    //async getAll(): Promise<IUserDTO[]> {
    async getAll(): Promise<IUser[]> {

        try {

            const items = await MUserRemoteInstance.findAll();

            if (items){

                return items.map((item)=> {
                    const {email,deleted,username,password,roles}  = item.toJSON();
                    const newRoles = roles.split(',');
                    return {email,deleted,username,password,roles:newRoles};
                });
            }

            return [];

        } catch (error) {
            throw new Error("Exception GetAll ORM");
        }
    }
    //async findOne(custom: IsearchItem): Promise<IUserDTO> {
    async findOne(custom: IsearchItem): Promise<IUser> {

        const {keycustom, valuecustom} = custom;

        const queryObj:IKeyValue = {};

        queryObj[keycustom] = valuecustom;

        try {
        
            const item = await MUserRemoteInstance.findOne({ where: queryObj });

            if (item){

                const {email,deleted,username,password,roles} = item.toJSON();

                const newRoles = roles.split(',');
    
                return {email,deleted,username,password,roles:newRoles};
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
            
            const item = await MUserRemoteInstance.destroy({
                where: queryObj}) ;

            if (item){
                return true
            }
            
        } catch (error) {
            const err = error as errorGenericType;
            throw new Error(`Exception on deleteOne ${err.message}`);
        }
      
        return false;
    }


    //async saveOne(item: IUserDTO): Promise<IUserDTO> {
    async saveOne(item: IUser): Promise<IUser> {
        try {

            const {email,deleted,username,password,roles} = item;

            const existe = await this.findOne({keycustom:'email',valuecustom:email});

            if (existe.email.length>0){
                throw new Error(`Exception on saveOne into duplicate email`);
            }

            let temp='';

            roles.map((item)=> temp = temp + item + ',');

            const newItem = {
                email,
                deleted,
                username,
                password,
                roles:temp,
                timestamp:Math.floor(Date.now()/1000),
                id: uuidv4()
            }

            const newInsertResult = await MUserRemoteInstance.create(newItem);

            if (newInsertResult){
                
                const {email,deleted,username,password,roles} = item;

                return {email,deleted,username,roles,password};
            }

            throw new Error(`Exception on create into ORM`);

        } catch (error:unknown) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on saveOne into ORM: ${err.message}`);
            throw new Error(`Exception on saveOne into ORM ${err.message} `);
        }

    }

}