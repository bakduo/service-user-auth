import { Schema } from 'mongoose';
import { IUserRemote } from '../dao/Iuser-remote';

export const SchemaUserRemote = new Schema<IUserRemote>({
    username: {
        type: String,
        trim: true,
        required: true,
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    roles:{
        type: [String],
        required: true,
        default: [],
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
        dropDups: true,
        match: [
            // eslint-disable-next-line no-useless-escape
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
            "Invalid email",
          ]
      },  
    deleted:{
        type: Boolean,
        required: true,
        default:false,
    },  
    timestamp: {
        type: Number,
        required: true,
        default: Math.floor(Date.now() / 1000),
      },
});

//SchemaUserRemote.index({ email: 1}, { unique: true});
