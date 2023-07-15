import * as chai from 'chai';
import { MQservice } from '../src/services/message/mq';
import { appconfig, loadMessageBroker } from '../src/init';
import { errorGenericType } from '../src/interfaces';

const expect = chai.expect;

let mq:MQservice;

describe('Test MQservice UNIT',async () => {

    before(async function(){
        console.log("###############BEGIN TEST MQ#################");
        await loadMessageBroker();
        mq = MQservice.getInstance(appconfig.message.queuename,appconfig.message.exchname,appconfig.message.routerkey);
    });

    after(async () => {
        console.log("###############AFTER TEST MQ#################");
        try {
            await mq.closeChannel();
            await mq.closeConnection();
            // setTimeout(() => {
            //     console.log('Sending');
            //     try {
            //       console.log("apagar");
            //     } catch (err) {
            //       console.log('Publish error');
            //     }
            //   }, 10000)
        } catch (error:unknown) {
            const err = error as errorGenericType;
            console.log(err.message);
            console.warn(err.stack);
        }
        
    });

    describe('Operations mq services', () => {
        it('debería generar un mensaje', async () => {
            console.log("#############SEND MSG###################");
            const msg = {
                appname:'userapi',
                type_event:'testing',
                date:Date.now()
            }
            const status = mq.sendMessage(msg);
            expect(status).to.eql(true);
            console.log("#############FINISHED SEND MSG###################");
        });

        it('debería obtener un mensaje', async () => {  
            console.log("#############RECIEVE SEND MSG###################");
            await mq.recieveMessage((msg:any)=>{
                const payload = JSON.parse(msg);
                //console.log(payload);
                // interface messageTmp {
                //     appname:string,
                //     type_event:string
                // }
                const msgOriginal = {
                    appname:'userapi',
                    type_event:'testing',
                }
                //const msg = mq.getMsg() as messageTmp;
                //console.log(msg);
                expect(payload.appname).to.eql(msgOriginal.appname);
                expect(payload.type_event).to.eql(msgOriginal.type_event);
            });

            // const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));
            // await sleep(2000);

            console.log("#############FINISHED RECIEVE SEND MSG###################");
        });
        
    });

});