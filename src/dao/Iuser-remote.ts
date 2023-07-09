export interface IUserRemote {
    email:string;
    username:string;
    timestamp:number;
    deleted:boolean;
    password:string;
    roles:string[];
    _id?:string;
    id?:number;
}
