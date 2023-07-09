import { loggerApp, ERRORS_APP, tokenDAO, appconfig } from '../init/configure';
import { errorGenericType } from '../interfaces/error';
import { ETokenInvalid } from './check-sign-token';
import { NextFunction, Request, Response } from 'express';
import { EBase, IToken } from '../interfaces/custom';
import { checkRealToken, isValidToken } from '../util/validToken';
import jwt from 'jsonwebtoken';

interface IRequestKC extends Request {
  kauth?:any;
  tokenkc?:any;
}

interface ITokenUserKC {
  scope: string;
  sid: string;
  email_verified: boolean;
  name: string;
  preferred_username: string,
  given_name: string;
  family_name: string;
  email: string;
  realm_access: {
    roles: any
  }
}

export const checkTokenKeycloak = async (req:Request, res:Response, next:NextFunction) => {
    try {
      
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {

        const token = req.headers.authorization.split(' ')[1];
        
        if (token){
          try {

            if ((req.headers.authorization.indexOf('bearer ') === 0) || (req.headers.authorization.indexOf('Bearer ') === 0)){
              return next();
            }

          } catch (error) {
            const err = error as errorGenericType;
            loggerApp.error(`Exception on checkToken into jwt.verify: ${err.message}`);
            next(new ETokenInvalid(`Token Invalid user ${err.message}`,ERRORS_APP.ETokenInvalid.code,ERRORS_APP.ETokenInvalid.HttpStatusCode));
          }

          //return next();
        }
      }

     return res.status(401).json({ message: 'Operation failed, required authorization' });

    } catch (error) {
      const err = error as errorGenericType;
      loggerApp.error(`Exception on checkToken into middleware: ${err.message}`);
      next(new EBase(`Exception on checkToken into middleware: ${err.message}`,ERRORS_APP.EBase.code));
    }
  };

  export const generateTokenApp = async (req:IRequestKC, res:Response, next:NextFunction) => {

      try {

        const tokenDataKC:ITokenUserKC = req.kauth.grant.access_token.content;

        const existeToken:IToken = await tokenDAO.findOne({keycustom:'email',valuecustom:tokenDataKC.email.toLowerCase()});

        try {
                    
            if (isValidToken(existeToken)){

                  try {

                      checkRealToken(existeToken.token);

                      req.tokenkc = {id:tokenDataKC.email.toLowerCase(),
                          username:tokenDataKC.name,
                          roles:tokenDataKC.realm_access.roles,
                          token:existeToken.token,
                          refreshToken:existeToken.refreshToken};

                      return next();

                  } catch (error) {
                      loggerApp.error(`Exception Token vencido se genera uno nuevo para el user: ${existeToken.email}`);
                  }
          }

        } catch (error) {
          const err = error as errorGenericType;
          loggerApp.error(`Exception on LocalStrategy into passport: ${err.message}`);
          next(new EBase(`Exception on tokenDAO findOne into login: ${err.message}`,ERRORS_APP.EBase.code));
        }
        

      const token = jwt.sign(
          {
              id:tokenDataKC.email.toLowerCase(),
              roles: tokenDataKC.realm_access.roles,
          },
          appconfig.jwt.secret,
          {
              expiresIn: appconfig.jwt.timeToken,
          }
          );

      const refreshToken = jwt.sign({
          id:tokenDataKC.email.toLowerCase(),
          roles:tokenDataKC.realm_access.roles,
      }, appconfig.jwt.secretRefresh);

      try {

          // if (updateToken){
          //     tokenSaved = await tokenDAO.updateOne(existeToken.token,{token:refreshToken,email:tokenDataKC.email.toLowerCase(),username:tokenDataKC.name,tmptoken:token,date:Date.now()});
          // }else{
          //     tokenSaved = await tokenDAO.saveOne({token:refreshToken,email:tokenDataKC.email.toLowerCase(),username:tokenDataKC.name,tmptoken:token,date:Date.now()});
          // }

          const tokenSaved = await tokenDAO.saveOne({token:token,email:tokenDataKC.email.toLowerCase(),username:tokenDataKC.name,tmptoken:'',refreshToken:refreshToken,date:Date.now()});

          if (tokenSaved){
            req.tokenkc = {id:tokenDataKC.email.toLowerCase(),username:tokenDataKC.name,roles:tokenDataKC.realm_access.roles,token:token,refreshToken:refreshToken};
            return next();
          }

      } catch (error) {
          const err = error as errorGenericType;
          loggerApp.error(`Exception on LocalStrategy into passport: ${err.message}`);
          return new EBase(`Exception on MongoTokenDao into saveOne: ${err.message}`,ERRORS_APP.EBase.code);
      }

    } catch (error) {
      const err = error as errorGenericType;
      loggerApp.error(`Exception on LocalStrategy into passport: ${err.message}`);
      next(new EBase(`Exception on LocalStrategy into MongoUserRemoteDao: ${err.message}`,ERRORS_APP.EBase.code));
    }    

  }