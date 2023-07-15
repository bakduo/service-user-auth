import * as chai from 'chai';
import { faker } from '@faker-js/faker';
import { tokenDAO } from '../src/init/configure';
import { errorGenericType } from '../src/interfaces/error';

const expect = chai.expect;

describe('Test TokenDAO UNIT',async () => {

    before(async function(){
        console.log("###############BEGIN TEST TokenDAO#################");        
        await Promise.all([
            tokenDAO.saveOne({token:faker.internet.password({ length: 20 }) ,refreshToken:faker.internet.password({ length: 20 }),email:faker.internet.email(),username:faker.person.firstName(),tmptoken:faker.internet.password({ length: 27 })}),
            tokenDAO.saveOne({token:faker.internet.password({ length: 20 }),refreshToken:faker.internet.password({ length: 20 }),email:faker.internet.email(),username:faker.person.firstName(),tmptoken:faker.internet.password({ length: 27 })}),
            tokenDAO.saveOne({token:faker.internet.password({ length: 20 }),refreshToken:faker.internet.password({ length: 20 }),email:faker.internet.email(),username:faker.person.firstName(),tmptoken:faker.internet.password({ length: 27 })}),
            tokenDAO.saveOne({token:faker.internet.password({ length: 20 }),refreshToken:faker.internet.password({ length: 20 }),email:faker.internet.email(),username:faker.person.firstName(),tmptoken:faker.internet.password({ length: 27 })}),
            tokenDAO.saveOne({token:faker.internet.password({ length: 20 }),refreshToken:faker.internet.password({ length: 20 }),email:faker.internet.email(),username:faker.person.firstName(),tmptoken:faker.internet.password({ length: 27 })}),
        ]);

    });

    after(async () => {
        console.log("###############AFTER TEST TokenDAO#################");
        await tokenDAO.deleteAll();
    });

    describe('Operaciones sobre Token DAO mongo', async () => {

        it('Debería agregar un token', async () => {

            const tokenTemp = faker.internet.password({ length: 20 });
            const refreshToken = faker.internet.password({ length: 20 });
            const item = await tokenDAO.saveOne({token:tokenTemp,refreshToken,email:faker.internet.email(),username:faker.internet.email(),tmptoken:faker.internet.password({ length: 27 })});
            expect(item).to.be.an('object');
            expect(item).to.have.property('token');
            expect(item).to.have.property('refreshToken');
            expect(item.token).to.equal(tokenTemp);
        });

        it('Debería listart todo', async () => {

            const listaUser = await tokenDAO.getAll();
            expect(listaUser).to.be.an('array');
            expect(listaUser).to.length(6);
        });
        
        it('Debería eliminar un token', async () => {

            const listaUser = await tokenDAO.getAll();

            const ok = await tokenDAO.deleteOne({keycustom:'token',valuecustom:listaUser[2].token});
            expect(ok).to.be.an('boolean');
            expect(ok).to.equal(true);
        });

        it('Debería buscar un token', async () => {

            const listaUser = await tokenDAO.getAll();

            const user = await tokenDAO.findOne({keycustom:'token',valuecustom:listaUser[3].token});
            expect(user).to.be.an('object');
            expect(user).to.have.property('token');
            expect(user.token).to.equal(listaUser[3].token);
        });

        it('Debería actualizar un token', async () => {

            const listaUser = await tokenDAO.getAll();

            const tokenTemp = faker.internet.password({ length: 20 });
            const refreshToken = faker.internet.password({ length: 20 });

            
            await tokenDAO.updateOne(listaUser[3].token,{token:tokenTemp,refreshToken:refreshToken,email:faker.internet.email(),username:faker.internet.email(),tmptoken:faker.internet.password({ length: 27 })});
            
            const tokenExist = await tokenDAO.findOne({keycustom:'token',valuecustom:tokenTemp});
            
            expect(tokenExist).to.be.an('object');
            expect(tokenExist).to.have.property('token');
            expect(tokenExist.token).to.equal(tokenTemp);

        });

        it('Debería saltar exception por token duplicado', async () => {

            const listaUser = await tokenDAO.getAll();

            try {
                await tokenDAO.saveOne({token:listaUser[0].token,refreshToken:listaUser[0].refreshToken,email:faker.internet.email(),username:faker.internet.email(),tmptoken:faker.internet.password({ length: 27 })});
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on saveOne into MongoDB E11000 duplicate key error collection");
            }
            
        });

        it('Debería saltar exception por update que no existe', async () => {

            try {
                await tokenDAO.updateOne('no existe',{token:'no existe',refreshToken:'',email:faker.internet.email(),username:faker.internet.email(),tmptoken:faker.internet.password({ length: 27 })});    
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on updateOne into MongoDB");
            }
            
        });

        it('Debería saltar exception por delete que no existe', async () => {

            try {
                await tokenDAO.deleteOne({keycustom:'token',valuecustom:'no existe'});
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on deleteOne into MongoDB");
            }
            
        });

        it('Debería saltar exception por find que no existe', async () => {

            try {
                await tokenDAO.findOne({keycustom:'token',valuecustom:'no existe'});
            } catch (error:unknown) {
                const err = error as errorGenericType;
                expect(err.message).to.contain("Exception on findOne into MongoDB");
            }
            
        });
        

    });


});
