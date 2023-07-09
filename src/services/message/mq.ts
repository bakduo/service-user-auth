
import { loggerApp } from "../../init";
import { IMessageAsync } from "./interfaces";
import amqp, { Channel, Message } from "amqplib";

export class MQservice implements IMessageAsync {

    private connection:amqp.Connection;
    private channel:Channel;
    private queuename:string;
    private exchangequeue:string;
    private routekey:string;
    private msgconsume:unknown;
    private static instance: MQservice;

    private constructor(_queue:string,_exch:string,_rkey:string){
        this.queuename = _queue;
        this.exchangequeue = _exch;
        this.routekey = _rkey;
    }

    public static getInstance(_queue:string,_exch:string,_rkey:string): MQservice {
        
            if (!MQservice.instance) {
                MQservice.instance = new MQservice(_queue,_exch,_rkey);
            }
    
            return MQservice.instance;
    }

    getMsg():unknown{
        return this.msgconsume;
    }
    
    private callFunction = (callback:Function,msg:Message) => {
        callback(msg);
    }
    
    async recieveMessage(callback:Function): Promise<unknown> {
        try {
            return await this.channel.consume(
                this.queuename,
                (message:unknown) => {

                  const msg = message as Message;

                  if (msg) {
                    
                    this.channel.ack(msg);

                    loggerApp.debug("[x] Received '%s'",JSON.parse(msg.content.toString()));
                    //console.log("[x] Received '%s'",JSON.parse(msg.content.toString()));
                    //this.msgconsume = JSON.parse(msg.content.toString());
                    this.callFunction(callback,msg);
                  }

                },
                //{ noAck: true }
              );
                          
        } catch (error) {
            throw new Error(`Error to recieveMessage server ${error}`);
        }   
    }

    async connect (server:string,port:number,vhost:string,username?:string,password?:string):Promise<amqp.Connection> {
        try {
            if (username && password){
                this.connection = await amqp.connect(`amqp://${username}:${password}@${server}:${port}//${vhost}`);
            }else{
                this.connection = await amqp.connect(`amqp://${server}:${port}//${vhost}`);
            }            
            return this.connection;
        } catch (error) {
            throw new Error(`Error to connect server ${error}`);
        }
    }

    getConnection():amqp.Connection {
        return this.connection;
    }

    async getChannel():Promise<Channel>{
        if (this.channel){
            return this.channel
        }else{
            this.channel = await this.connection.createChannel();
            return this.channel
        }
    }

    async configureChannel(){
        try {
            await this.channel.assertExchange(this.exchangequeue, 'direct', {durable: true}).catch(console.error);
            await this.channel.assertQueue(this.queuename, {durable: true});
            await this.channel.bindQueue(this.queuename, this.exchangequeue, this.routekey);
            await this.channel.prefetch(1);
        } catch (error) {
            throw new Error(`Error to connect server ${error}`);
        }
    }

    async configureChannelForConsume(){
        try {
            await this.channel.bindQueue(this.queuename, this.exchangequeue, this.routekey);
            await this.channel.prefetch(1);
        } catch (error) {
            throw new Error(`Error to connect server ${error}`);
        }
    }

    setChannel(ch:Channel){
        this.channel = ch;
    }

    sendMessage(body: unknown): boolean {
        try {
            //const out = await this.channel.publish(this.exchangequeue, this.routekey,Buffer.from(JSON.stringify(body)));
            const state = this.channel.sendToQueue(this.queuename, Buffer.from(JSON.stringify(body)));
            return state;
          } catch (error) {
            throw new Error(`Error to connect server ${error}`); 
          }
    }

    async closeChannel(){
        try {
            if (this.channel){
                await this.channel.close();
            }    
        } catch (error) {
            throw new Error(`Error close channel server ${error}`);
        }
    }

    async closeConnection(){
        try {
            if (this.connection){
                await this.connection.close();
            }    
        } catch (error) {
            throw new Error(`Error close connection server ${error}`);
        }
    }
   
}