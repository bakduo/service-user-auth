import {Request, Response, NextFunction} from 'express';
import { userDAO, tokenDAO, loggerApp, ERRORS_APP } from '../init';
import { IUserToken, errorGenericType } from '../interfaces';
import { ETokenInvalid } from '../middleware';
import { isValidUser } from '../util';
import { isValidToken } from '../util/validToken';

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
                return res.status(200).json({message:'User Deleted'});
            }
    
            return res.status(404).json({message:'user not found'});
        }

        return res.status(401).json({message:'User not have privileges'});
        
    }

    postLogin = async (req:Request,res:Response,next:NextFunction) => {
        
        if (req.user) {

            const user = req.user as IUserToken;

            return res.status(200).json({ token: user.token, refreshToken: user.refreshToken, fail: false });
        }
        return res.status(401).json({ fail: 'Error al realizar post login' });
    };
 
    postLogout = async (req:Request,res:Response,next:NextFunction) =>{

        try {

            const user = req.user as IUserToken;

            const existe = await tokenDAO.findOne({keycustom:'token',valuecustom:user.token || ''});
        
            if (isValidToken(existe)){
        
                try {
        
                    const deleted = await tokenDAO.deleteOne({keycustom:'token',valuecustom:user.token || ''});
        
                    if (deleted){
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