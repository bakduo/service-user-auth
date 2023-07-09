import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { tokenDAO, appconfig, loggerApp, ERRORS_APP } from '../init';
import { EBase, ITokenDecode, errorGenericType } from '../interfaces';
import { isValidToken, checkRealToken } from '../util/validToken';

export class ETokenInvalid extends EBase {

  constructor(description:string,_code:number,_httpcode:number){
      super(description,_code,'',_httpcode);
  }   
}

export const checkForRefreshToken = async (req:Request, res:Response, next:NextFunction) => {

    const { token } = req.body;

    if (!token) {
        return res.status(401).json({message:'Invalid request'});
    }
    
    const existe = await tokenDAO.findOne({keycustom:'token',valuecustom:token});

    if (!isValidToken(existe)){
      return res.status(403).json({message:'Forbidden Request'});
    }

    try {
      
      const decoded = jwt.verify(token, appconfig.jwt.secretRefresh);

      const {id, roles} = decoded as ITokenDecode;

        const accessToken = jwt.sign({id, roles}, appconfig.jwt.secret, { expiresIn: appconfig.jwt.timeToken });

        const refreshToken = jwt.sign({
          id:id,
          roles: roles,
      }, appconfig.jwt.secretRefresh);

        if (accessToken){
          await tokenDAO.updateOne(token,{token:accessToken,refreshToken:refreshToken,email:existe.email,username:existe.email,tmptoken:'',date:Date.now()});
        }

        req.user = {id,roles};
  
        return next();  

    } catch (error) {
       const err = error as errorGenericType;
       loggerApp.error(`Exception on checkToken into jwt.verify: ${err.message}`);
       next(new ETokenInvalid(`Token Invalid user ${err.message}`,ERRORS_APP.ETokenInvalid.code,ERRORS_APP.ETokenInvalid.HttpStatusCode));
    }

}

export const checkToken = async (req:Request, res:Response, next:NextFunction) => {
    try {
      
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {

        const token = req.headers.authorization.split(' ')[1];

        if (token){
          try {
            
            const {id,roles} = checkRealToken(token);

            req.user = {id,roles,token,email:'',username:'',password:'',refreshToken:''};

          } catch (error) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on checkToken into jwt.verify: ${err.message}`);
            return next(new ETokenInvalid(`Token Invalid user ${err.message}`,ERRORS_APP.ETokenInvalid.code,ERRORS_APP.ETokenInvalid.HttpStatusCode));
          }

          return next();
        }
      }

     return res.status(401).json({ message: 'Operation failed, required authorization' });

    } catch (error) {
      const err = error as errorGenericType;
      loggerApp.error(`Exception on checkToken into middleware: ${err.message}`);
      next(new EBase(`Exception on checkToken into middleware: ${err.message}`,ERRORS_APP.EBase.code));
    }
  };

  export const checkTokenByRequest = async (req:Request, res:Response, next:NextFunction) => {
    try {
      
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {

        const token = req.headers.authorization.split(' ')[1];
        
        if (token){
          try {
            
            const {id,roles} = checkRealToken(token);
            if (id && roles.length > 0){
              if (roles.includes('user') || roles.includes('admin')){
                return res.status(200).json({token:{status:'valid'}})
              }
            }

          } catch (error) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on checkToken into jwt.verify: ${err.message}`);
            next(new ETokenInvalid(`Token Invalid user ${err.message}`,ERRORS_APP.ETokenInvalid.code,ERRORS_APP.ETokenInvalid.HttpStatusCode));
          }

          return next();
        }
      }

     return res.status(401).json({ message: 'Operation failed, required authorization' });

    } catch (error) {
      const err = error as errorGenericType;
      loggerApp.error(`Exception on checkToken into middleware: ${err.message}`);
      next(new EBase(`Exception on checkToken into middleware: ${err.message}`,ERRORS_APP.EBase.code));
    }
  };
