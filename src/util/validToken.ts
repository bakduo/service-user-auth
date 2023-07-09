
import jwt from 'jsonwebtoken';
//import { ITokenDTO } from '../dto';
import { appconfig } from '../init';
import { IToken, ITokenDecode } from '../interfaces';

//export const isValidToken = (tokenRemote:ITokenDTO):boolean =>{
export const isValidToken = (tokenRemote:IToken):boolean =>{

    if (tokenRemote.token.length<=0){
      return false;
    }
    
    return true;
}

export const checkRealToken = (token:string):ITokenDecode => {

    const decoded = jwt.verify(token, appconfig.jwt.secret);
  
    const {id, roles} = decoded as ITokenDecode;
  
    return {id, roles};

}
