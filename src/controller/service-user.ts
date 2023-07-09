import {Request, Response, NextFunction} from 'express';
import { userDAO, tokenDAO, loggerApp, ERRORS_APP, appconfig } from '../init';
import { IUserToken, errorGenericType } from '../interfaces';
import { ETokenInvalid } from '../middleware';
import { isValidPassword, isValidUser } from '../util';
import { isValidToken } from '../util/validToken';
import { MQservice } from '../services';
import bcrypt from 'bcrypt';

export class ControllerServiceAuth {


    count = async (req:Request,res:Response,next:NextFunction)=>{

        const user = req.user as IUserToken;

        if (user.roles.includes('admin')){
    
            const allUsers = await userDAO.getAll();
    
            return res.status(200).json({users:allUsers,cant:allUsers.length});
        }

        res.status(401).json({message:'User not have privileges'});
    }


    search = async (req:Request,res:Response,next:NextFunction)=>{

        const user = req.user as IUserToken;

        if (user.roles.includes('admin')){

            const {email,remoteuser,password,roles} = req.body;
    
            const encontrado = await userDAO.findOne({keycustom:'email',valuecustom:email.toLowerCase()});
    
            if (isValidUser(encontrado)){
                return res.status(200).json(encontrado);
            }
    
            return res.status(404).json({message:'user not found'});
        }

        return res.status(401).json({message:'User not have privileges'});
    }


    delete = async (req:Request,res:Response,next:NextFunction)=>{


        const user = req.user as IUserToken;

        if (user.roles.includes('admin')){

            const {email} = req.body;

            const encontrado = await userDAO.deleteOne({keycustom:'email',valuecustom:email.toLowerCase()});
    
            if (encontrado){
                if (appconfig.message.enable){
                    try {
                        const mqs = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
                        const message = {
                            appname:'userapi',
                            date:Date.now(),
                            type_event:'delete_user'
                        }
                        mqs.sendMessage(message);
                    } catch (error) {
                        const err = error as errorGenericType;
                        loggerApp.error(`Exception on send message queue broker: ${err.message}`);
                    }
                }
                return res.status(200).json({message:'User Deleted'});
            }
    
            return res.status(404).json({message:'user not found'});
        }

        return res.status(401).json({message:'User not have privileges'});
        
    }

    postLogin = async (req:Request,res:Response,next:NextFunction) => {
        
        if (req.user) {

            const user = req.user as IUserToken;

            if (appconfig.message.enable){
                try {
                    const mqs = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
                    const message = {
                        appname:'userapi',
                        date:Date.now(),
                        type_event:'login'
                    }
                    mqs.sendMessage(message);
                } catch (error) {
                    const err = error as errorGenericType;
                    loggerApp.error(`Exception on postLogin send message queue broker: ${err.message}`);
                }
            }

            return res.status(200).json({ token: user.token, refreshToken: user.refreshToken, fail: false });
        }
        return res.status(401).json({ fail: 'Error al realizar post login' });
    };

    updatePassword = async (req:Request,res:Response,next:NextFunction) => {
        
        if (req.user) {

            const {email,password,password_new} = req.body;

            try {
                const encontrado = await userDAO.findOne({keycustom:'email',valuecustom:email.toLowerCase()});
    
                if (isValidUser(encontrado)){

                        const valid = await isValidPassword(password,encontrado.password);

                        if (valid){
                            const newPassword = bcrypt.hashSync(
                                password_new,
                                bcrypt.genSaltSync(11));
                            encontrado.password = newPassword;

                            await userDAO.updateOne(email.toLowerCase(),encontrado);

                            if (appconfig.message.enable){
                                try {
                                    const mqs = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
                                    const user = req.user as IUserToken;
                                    const message = {
                                        appname:'userapi',
                                        date:Date.now(),
                                        type_event:'update-password'
                                    }
                                    mqs.sendMessage(message);
                                } catch (error) {
                                    const err = error as errorGenericType;
                                    loggerApp.error(`Exception rabbitmq on updatePassword send message queue broker: ${err.message}`);
                                }
                            }
                
                            return res.status(201).json({ message: "User update OK", userid: email});
                        }
                }
                
            }catch(error) {
                const err = error as errorGenericType;
                loggerApp.error(`Exception on updatePassword into datastore: ${err.message}`);
                return next(new ETokenInvalid(`updatePassword user ${err.message}`,ERRORS_APP.EUpdatePasswd.code,ERRORS_APP.EUpdatePasswd.HttpStatusCode));
                
            }
        }

        return res.status(401).json({ fail: 'Petición no satisfactoria para el usuario.' });
            
    };

 
    postLogout = async (req:Request,res:Response,next:NextFunction) =>{

        try {

            const user = req.user as IUserToken;

            const existe = await tokenDAO.findOne({keycustom:'token',valuecustom:user.token || ''});
        
            if (isValidToken(existe)){
        
                try {
        
                    const deleted = await tokenDAO.deleteOne({keycustom:'token',valuecustom:user.token || ''});
        
                    if (deleted){
                        if (appconfig.message.enable){
                            try {
                                const mqs = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
                                const message = {
                                    appname:'userapi',
                                    date:Date.now(),
                                    type_event:'logout'
                                }
                                mqs.sendMessage(message);
                            } catch (error) {
                                const err = error as errorGenericType;
                                loggerApp.error(`Exception on send message queue broker: ${err.message}`);
                            }
                        }
                        return  res.status(200).json({message:"Logout successful"});
                    }
        
                    return res.status(404).json({message:"Logout don't found token for delete"});
        
                }catch(error){
        
                    const err = error as errorGenericType;
                    
                    loggerApp.error(`Exception on postLogout into jwt.deleteOne: ${err.message}`);
                    
                    return next(new ETokenInvalid(`Token Invalid user ${err.message}`,ERRORS_APP.ETokenInvalid.code,ERRORS_APP.ETokenInvalid.HttpStatusCode));
        
                }
            }
        
            return  res.status(404).json({message:"Logout don't found token for delete"});
            
            
        } catch (error) {
            next(error);
        }
        
    }

    postSignup = async (req:Request,res:Response,next:NextFunction) =>{

        try {
            
            const user = req.user as IUserToken;
            
            const {id,roles} = user;

            return res.status(201).json({profile:{id,roles}});
        } catch (error) {
            next(error);
        }
        
    }

    showProfile = async (req:Request,res:Response,next:NextFunction)=>{
        
        try {
            const user = req.user as IUserToken;

            const {id,roles} = user;

            return res.status(200).json({profile:{id,roles}});
        } catch (error) {
            next(error);
        }
    }
}