
import express from 'express';
import passport from 'passport';
import {Request, Response, NextFunction} from 'express';
import { ControllerServiceAuth } from '../controller/service-user';
import { errorTypeMiddleware } from '../interfaces';
import { initPassport, checkToken, checkForRefreshToken, checkTokenByRequest } from '../middleware';

export const routerGlobal = express.Router();

initPassport();

const controller = new ControllerServiceAuth();

routerGlobal.post('/login',

passport.authenticate('login',{'failureRedirect':'/faillogin'}),

controller.postLogin);

routerGlobal.post('/logout',checkToken,controller.postLogout);

routerGlobal.post('/find',checkToken,controller.search);

routerGlobal.post('/count',checkToken,controller.count);

routerGlobal.delete('/delete',checkToken,controller.delete);

routerGlobal.post('/signup',passport.authenticate('signup',{'failureRedirect':'/failsignup'}),controller.postSignup);

routerGlobal.get('/failsignup',(err:errorTypeMiddleware,req:Request,res:Response,next:NextFunction)=>{
    next(err);
});

routerGlobal.get('/faillogin',(err:errorTypeMiddleware,req:Request,res:Response,next:NextFunction)=>{
    next(err);
});

routerGlobal.get('/profile',checkToken,controller.showProfile);

routerGlobal.post('/token',checkForRefreshToken,controller.showProfile);

routerGlobal.post('/token-valid',checkTokenByRequest);

routerGlobal.post('/update-password',checkToken,controller.updatePassword);
