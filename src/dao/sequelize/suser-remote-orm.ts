import { DataTypes, Model, Sequelize } from 'sequelize';

interface UserRemoteAttributes {
    email:string;
    username:string;
    timestamp:number;
    deleted:boolean;
    password:string;
    roles:string;
    id:string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class MUserRemoteInstance extends Model<UserRemoteAttributes> {}

export function initMUserRemoteInstance(db:Sequelize){

  MUserRemoteInstance.init({
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      unique:true
    },
    username: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    deleted:{
      type: new DataTypes.BOOLEAN,
      allowNull: false
    },
    password:{
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    roles:{
      type: new DataTypes.STRING,
      allowNull: false
    },
    timestamp:{
      type: DataTypes.INTEGER,
      allowNull: false
    }
},{
    sequelize:db,
    tableName:'UserRemote',
    timestamps: true,
    paranoid: true
});
}
