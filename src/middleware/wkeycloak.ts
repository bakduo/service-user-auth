import { MemoryStore } from 'express-session';
import KeycloakConnect, { KeycloakOptions } from 'keycloak-connect';
import { sessionStore } from '../init/configure';

export class WKeycloak {

    private static InstanceKeycloak:KeycloakConnect.Keycloak;

    public static getInstanceKeycloak(_mem?:MemoryStore){

        if (!WKeycloak.InstanceKeycloak){

            /*
            REMEMBER: KEYCLOAK.JSON CONFIGURATION EN CORE PATH
            */

            const options:KeycloakOptions = {
                store: _mem || sessionStore.getStore()
            }
    
            WKeycloak.InstanceKeycloak = new KeycloakConnect(options);
        }

        return WKeycloak.InstanceKeycloak;
    }
}