import express from 'express';
import { Request, Response } from 'express';
import { Token } from 'keycloak-connect';
import { WKeycloak } from '../middleware/wkeycloak';
import { checkTokenKeycloak, generateTokenApp } from '../middleware/check-token-keycloack';

export const routerKeycloak = express.Router();

const keycloak = WKeycloak.getInstanceKeycloak();

interface IRequestKC extends Request{
        tokenkc?: any;
}

function checkRoleKC(token:Token, request:Request) {
        return token.hasRole('realm:user') || token.hasRole('user');
}

routerKeycloak.get('/user',[checkTokenKeycloak,keycloak.protect(checkRoleKC),generateTokenApp],async (req:IRequestKC,res:Response)=>{
        res.json(req.tokenkc);
});

routerKeycloak.get('/admin',[checkTokenKeycloak,keycloak.protect('admin-service'),generateTokenApp],(req:IRequestKC,res:Response)=>{
        res.json(req.tokenkc);
});
