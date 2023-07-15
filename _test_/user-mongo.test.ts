import * as chai from 'chai';
import { faker } from '@faker-js/faker';
import { loadUserDAO, userDAO } from '../src/init/configure';
import { errorGenericType } from '../src/interfaces/error';

const expect = chai.expect;

describe('Test UserDAO UNIT',async () => {

    before(async function(){

        await loadUserDAO();

        console.log("###############BEGIN TEST UserDAO#################");

    
        await Promise.all([
            userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['user'],username:faker.internet.userName(),password:"sample"}),
            userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['user'],username:faker.internet.userName(),password:"sample"}),
            userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['user'],username:faker.internet.userName(),password:"sample"}),
            userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['user'],username:faker.internet.userName(),password:"sample"}),
            userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['user'],username:faker.internet.userName(),password:"sample"})]);

    });

    after(async () => {
        console.log("###############AFTER TEST UserDAO#################");
        await userDAO.deleteAll();
    });

    describe('Operaciones sobre User DAO', async () => {

        it('Debería agregar un user', async () => {

            const item= await userDAO.saveOne({email:faker.internet.email(),deleted:false,roles:['admin'],username:faker.internet.userName(),password:"sample"});
            expect(item).to.be.an('object');
            expect(item).to.have.property('email');
            expect(item).to.have.property('roles');
            expect(item.deleted).to.equal(false);
        });

        it('Debería listart todo', async () => {

            const listaUser = await userDAO.getAll();
            expect(listaUser).to.be.an('array');
            expect(listaUser).to.length(6);
        });
        
        it('Debería eliminar un user', async () => {

            const listaUser = await userDAO.getAll();

            const ok = await userDAO.deleteOne({keycustom:'email',valuecustom:listaUser[2].email});
            expect(ok).to.be.an('boolean');
            expect(ok).to.equal(true);
        });

        it('Debería buscar un user', async () => {

            const listaUser = await userDAO.getAll();

            const user = await userDAO.findOne({keycustom:'email',valuecustom:listaUser[3].email});
            expect(user).to.be.an('object');
            expect(user).to.have.property('email');
            expect(user.email).to.equal(listaUser[3].email);
        });

        it('Debería actualizar un user', async () => {

            const listaUser = await userDAO.getAll();
            
            await userDAO.updateOne(listaUser[3].email,{email:listaUser[3].email,deleted:false,roles:['admin','user'],username:faker.internet.userName(),password:"sample"});
    
            const user = await userDAO.findOne({keycustom:'email',valuecustom:listaUser[3].email});
            
            expect(user).to.be.an('object');
            expect(user).to.have.property('email');
            expect(user.password).to.equal(listaUser[3].password);
            expect(user.roles).to.be.an('array');
            expect(user.roles[0]).to.equal("admin");

        });

        it('Debería saltar exception por mail duplicado', async () => {

            const listaUser = await userDAO.getAll();

            try {
                await userDAO.saveOne({email:listaUser[0].email,deleted:false,roles:['admin'],username:faker.internet.userName(),password:"sample"});    
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on saveOne into");
            }
            
        });

        it('Debería saltar exception por update que no existe', async () => {

            try {
                await userDAO.updateOne('no existe',{email:'no existe',deleted:false,roles:['admin'],username:faker.internet.userName(),password:"sample"});    
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on updateOne into MongoDB");
            }
            
        });

        it('Debería saltar exception por delete que no existe', async () => {

            try {
                await userDAO.deleteOne({keycustom:'email',valuecustom:'no existe'});
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on deleteOne into MongoDB");
            }
            
        });

        it('Debería saltar exception por find que no existe', async () => {

            try {
                await userDAO.findOne({keycustom:'email',valuecustom:'no existe'});
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on findOne into MongoDB");
            }
            
        });
        

    });


});
