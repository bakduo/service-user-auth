import bcrypt from 'bcrypt';

export const isValidPassword = async (passwordRemote:string, passwordOrig:string) => {
    return bcrypt.compareSync(passwordRemote, passwordOrig);
};
