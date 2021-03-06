/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';

import { IdCard } from 'composer-common';
import { AdminService } from './admin.service';
import { IdentityCardStorageService } from './identity-card-storage.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';

const hash = require('object-hash');

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { IdentityCardService } from './identity-card.service';

describe('IdentityCardService', () => {

    let mockAdminService;
    let mockIdentityCardStorageService;
    let mockConnectionProfileService;
    let mockIdentityService;

    beforeEach(() => {
        mockAdminService = sinon.createStubInstance(AdminService);
        mockIdentityCardStorageService = sinon.createStubInstance(IdentityCardStorageService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockIdentityService = sinon.createStubInstance(IdentityService);

        TestBed.configureTestingModule({
            providers: [IdentityCardService,
                {provide: AdminService, useValue: mockAdminService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: IdentityCardStorageService, useValue: mockIdentityCardStorageService}
            ]
        });
    });

    describe('#getIdentityCard', () => {
        it('should get the specified identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            service.getIdentityCard('test').should.equal(mockIdCard);
        })));

        it('should not get an identity card if it does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getIdentityCard('test'));
        })));
    });

    describe('#getCurrentIdentityCard', () => {
        it('should get the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
            service['currentCard'] = 'test';

            service.getCurrentIdentityCard().should.equal(mockIdCard);
        })));

        it('should not get an identity card if there is no current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getCurrentIdentityCard());
        })));
    });

    describe('#getIndestructibleIdentityCards', () => {
        it('should get an array of indestructible identity card refs', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service['indestructibleCards'] = ['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'];

            service.getIndestructibleIdentityCards().should.deep.equal(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
        })));
    });

    describe('#getIdentityCardForExport', () => {
        let idCard1;
        let idCard2;
        let mockCardMap;
        let credentials;

        beforeEach(() => {
            credentials = { certificate: 'CERTIFICATE', privateKey: 'PRIVATE_KEY' };
            mockAdminService.exportIdentity.withArgs(sinon.match.any, 'card1').resolves(credentials);
            mockAdminService.exportIdentity.withArgs(sinon.match.any, 'card2').resolves(credentials);

            idCard1 = new IdCard({
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, { name: 'hlfv1' });

            idCard2 = new IdCard({
                userName: 'card2',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, { name: 'hlfv1' });

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', idCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', idCard2);
        });

        it('should get an unused identity card without credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCardForExport('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((card) => {
                result = card;
            });

            tick();

            mockAdminService.exportIdentity.should.not.have.been.called;
            result.getUserName().should.equal(idCard1.getUserName());
            result.getBusinessNetworkName().should.equal(idCard1.getBusinessNetworkName());
            result.getEnrollmentCredentials().should.deep.equal(idCard1.getEnrollmentCredentials());
            result.getConnectionProfile().should.deep.equal(idCard1.getConnectionProfile());
            result.getCredentials().should.deep.equal({});
        })));

        it('should get a used identity card with credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCardForExport('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((card) => {
                result = card;
            });

            tick();

            mockAdminService.exportIdentity.should.have.been.called;
            result.getUserName().should.equal(idCard2.getUserName());
            result.getBusinessNetworkName().should.equal(idCard2.getBusinessNetworkName());
            result.getEnrollmentCredentials().should.deep.equal(idCard2.getEnrollmentCredentials());
            result.getConnectionProfile().should.deep.equal(idCard2.getConnectionProfile());
            result.getCredentials().should.deep.equal(credentials);
        })));
    });

    describe('#loadIdentityCards', () => {
        beforeEach(() => {
            mockIdentityCardStorageService.keys.returns(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', 'uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd']);
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"userName":"NetworkAdmin","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"userName":"Mr Penguin","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"userName":"Eric","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"conga"},"credentials":null}'));
        });

        it('should load cards from local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let setCurrentIdentityCardStub = sinon.stub(service, 'setCurrentIdentityCard');
            setCurrentIdentityCardStub.returns(Promise.resolve());

            let result: number;
            service['currentCard'] = 'someCardRef';
            service.loadIdentityCards(false).then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(3);
            service['idCards'].size.should.equal(3);
            should.not.exist(service['currentCard']);
            setCurrentIdentityCardStub.should.not.have.been.called;
        })));

        it('should only load cards with web connection profiles from local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let result: number;
            service['currentCard'] = 'someCardRef';
            service.loadIdentityCards(true).then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(2);
            service['idCards'].size.should.equal(2);
            should.exist(service['idCards'].get('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'));
            should.exist(service['idCards'].get('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'));
            should.not.exist(service['idCards'].get('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'));
            should.not.exist(service['currentCard']);
        })));

        it('should not load anything if there are no cards in local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.keys.returns([]);

            let result: number;
            service.loadIdentityCards(false).then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(0);
            mockIdentityCardStorageService.get.should.not.have.been.called;
        })));

        it('should throw error if card cannot be loaded', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.keys.returns(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
            mockIdentityCardStorageService.get.withArgs('lalalalalalalala');

            service.loadIdentityCards(false).then((cardsLoaded) => {
                throw Error('Card loaded without error');
            }).catch((reason) => {
                reason.should.be.an.instanceof(Error);
            });

            tick();
        })));

        it('should set the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let setCurrentIdentityCardStub = sinon.stub(service, 'setCurrentIdentityCard');
            setCurrentIdentityCardStub.returns(Promise.resolve());

            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"userName":"NetworkAdmin","businessNetwork":"basic-sample-network"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns(JSON.parse('{"current":true}'));

            service.loadIdentityCards(false);

            tick();

            service['currentCard'].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            setCurrentIdentityCardStub.should.have.been.called;
        })));

        it('should keep track of indestructible identity cards', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let setCurrentIdentityCardStub = sinon.stub(service, 'setCurrentIdentityCard');
            setCurrentIdentityCardStub.returns(Promise.resolve());

            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"userName":"NetworkAdmin","businessNetwork":"basic-sample-network"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns(JSON.parse('{"indestructible":true}'));

            service.loadIdentityCards(false);

            tick();

            should.not.exist(service['currentCard']);
            service['indestructibleCards'].length.should.equal(1);
            service['indestructibleCards'][0].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            setCurrentIdentityCardStub.should.not.have.been.called;
        })));
    });

    describe('#getIdentityCards', () => {
        it('should get identity cards', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let loadIdentityCardsSpy = sinon.spy(service, 'loadIdentityCards');
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('penguin');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCards().then((idCards) => {
                result = idCards;
            });

            tick();

            result.size.should.equal(1);
            result.get('test').getUserName().should.equal('penguin');
            loadIdentityCardsSpy.should.not.have.been.called;
        })));
    });

    describe('#addInitialIdentityCards', () => {
        it('should create initial identity cards from array', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            let initialCards = [mockIdCard1, mockIdCard2];
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');

            let cardRefs;
            service.addInitialIdentityCards(initialCards).then((results) => {
                cardRefs = results;
            });

            tick();

            addIdentityCardSpy.should.have.been.calledThrice;
            service['idCards'].get(cardRefs[0]).getUserName().should.equal('admin');
            service['idCards'].size.should.equal(3);
        })));

        it('should only add default identity card if initial card array is not specified', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let cardRefs;
            service.addInitialIdentityCards().then((results) => {
                cardRefs = results;
            });

            tick();

            service['idCards'].get(cardRefs[0]).getUserName().should.equal('admin');
            service['idCards'].get(cardRefs[0]).getConnectionProfile().name.should.equal('$default');
            service['idCards'].get(cardRefs[0]).getEnrollmentCredentials().should.deep.equal({secret: 'adminpw'});
        })));

        it('should not add inital identity cards if there are any identity cards already', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
            let addCardSpy = sinon.spy(service, 'addIdentityCard');

            let cardRefs;
            service.addInitialIdentityCards().then((results) => {
                cardRefs = results;
            });

            tick();

            should.not.exist(cardRefs);
            addCardSpy.should.not.have.been.called;
            service['idCards'].size.should.equal(1);
        })));
    });

    describe('#createIdentityCard', () => {
        it('should create and store an identity card using enrollment ID and secret', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');
            let cardMock = sinon.createStubInstance(IdCard);
            let connectionProfile = {
                name: 'hlfv1'
            };

            service.createIdentityCard('admin', 'cashless-network', 'adminpw', connectionProfile, null, [])
                .then((cardRef) => {
                    let myCard = service.getIdentityCard(cardRef);
                    myCard.getCredentials().should.be.empty;
            }).catch((error) => {
                fail('test failed with error' + error);
            });

            tick();

            service['idCards'].size.should.equal(1);
            cardMock.setCredentials.should.not.have.been.called;
            addIdentityCardSpy.should.have.been.called;
        })));

        it('should create and store an identity card using certificates and roles', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');
            let connectionProfile = {
                name: 'hlfv1'
            };
            let credentials = {
                certificate: 'certificate',
                privateKey: 'privateKey'
            };

            service.createIdentityCard('admin', 'cashless-network', null, connectionProfile, credentials, ['PeerAdmin', 'ChannelAdmin'])
                .then((cardRef) => {
                    let myCard = service.getIdentityCard(cardRef);
                    myCard.getCredentials().should.deep.equal(credentials);
                    myCard.getRoles().should.deep.equal(['PeerAdmin', 'ChannelAdmin']);
            }).catch((error) => {
                fail('test failed with error' + error);
            });

            tick();

            service['idCards'].size.should.equal(1);
            addIdentityCardSpy.should.have.been.called;
        })));
    });

    describe('#addIdentityCard', () => {
        it('should add an identity card without credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let activateIdentityCardStub = sinon.stub(service, 'activateIdentityCard');
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('bcc');

            let result;
            service.addIdentityCard(mockIdCard).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            service['indestructibleCards'].length.should.equal(0);
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith(result);
            mockIdentityCardStorageService.set.should.have.been.calledWith(result + '-pd', {unused: true, indestructible: false});
            activateIdentityCardStub.should.not.have.been.called;
        })));

        it('should add and activate an identity card with credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let activateIdentityCardStub = sinon.stub(service, 'activateIdentityCard');
            activateIdentityCardStub.returns(Promise.resolve());
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('bcc');
            mockIdCard.getCredentials.returns({certificate: 'CERTIFICATE', privateKey: 'PRIVATE_KEY'});

            let result;
            service.addIdentityCard(mockIdCard).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            service['indestructibleCards'].length.should.equal(0);
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith(result);
            mockIdentityCardStorageService.set.should.have.been.calledWith(result + '-pd', {unused: true, indestructible: false});
            activateIdentityCardStub.should.have.been.called;
        })));

        it('should add an indestructible identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let activateIdentityCardStub = sinon.stub(service, 'activateIdentityCard');
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('bcc');

            let result;
            service.addIdentityCard(mockIdCard, true).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            service['indestructibleCards'].length.should.equal(1);
            service['indestructibleCards'][0].should.equal(result);
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith(result);
            mockIdentityCardStorageService.set.should.have.been.calledWith(result + '-pd', {unused: true, indestructible: true});
        })));
    });

    describe('#deleteIdentityCard', () => {
        const mockConnectionProfile = {
            name: 'hlfv1'
        };
        let mockIdCard;

        const setupTest = (service: IdentityCardService) => {
            mockConnectionProfileService.deleteProfile.returns(Promise.resolve());

            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('alice');
            mockIdCard.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.returns({
                secret: 'sauce'
            });
            const mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
        };

        it('should delete an identity card and remove from wallet', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith(expectedProfileName);
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test-pd');
        })));

        it('should delete an identity card and not remove if not in wallet', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith(expectedProfileName);
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test-pd');
        })));

        it('should delete an identity card but not delete connection profile', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(2);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockConnectionProfileService.deleteProfile.should.not.have.been.called;
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test-pd');
        })));

        it('should delete an identity card that doesn\'t have an enrollment id', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);
            mockIdCard.getEnrollmentCredentials.returns(null);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith(expectedProfileName);
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test-pd');
        })));

        it('should not delete an identity card that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {

            let result;
            service.deleteIdentityCard('test').then(() => {
                throw Error('Identity card deleted without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });

    describe('#setCurrentIdentityCard', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockConnectionProfile2;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfileService.createProfile.returns(Promise.resolve());

            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getEnrollmentCredentials.returns({id: 'admin'});
            mockIdCard1.getConnectionProfile.returns({name: '$default', type: 'web'});

            mockConnectionProfile2 = {name: 'hlfv1'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getEnrollmentCredentials.returns({id: 'admin'});
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
        });

        it('should set the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let activateIdentityCardStub = sinon.stub(service, 'activateIdentityCard');
            let getQualifiedProfileNameStub = sinon.stub(service, 'getQualifiedProfileName');
            getQualifiedProfileNameStub.returns('fqn');
            activateIdentityCardStub.returns(Promise.resolve());
            service['idCards'] = mockCardMap;

            service.setCurrentIdentityCard('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            mockConnectionProfileService.createProfile.should.not.have.been.called;
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {current: true});
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('fqn', mockIdCard1);
        })));

        it('should change the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let activateIdentityCardStub = sinon.stub(service, 'activateIdentityCard');
            let getQualifiedProfileNameStub = sinon.stub(service, 'getQualifiedProfileName');
            getQualifiedProfileNameStub.returns('fqn');
            activateIdentityCardStub.returns(Promise.resolve());
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                current: true
            });
            service['idCards'] = mockCardMap;
            service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

            service.setCurrentIdentityCard('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            let expectedProfileName = hash(mockConnectionProfile2) + '-hlfv1';
            mockConnectionProfileService.createProfile.should.not.have.been.called;
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {});
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {current: true});
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('fqn', mockIdCard2);
        })));

        it('should not set the current identity card to one that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let result;
            service.setCurrentIdentityCard('uuid0xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((currentCard) => {
                throw Error('Current identity card set without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });

    describe('activateIdentityCard', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfileService.createProfile.returns(Promise.resolve());

            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('admin');
            mockIdCard1.getEnrollmentCredentials.returns({secret: 'adminpw'});
            mockIdCard1.getConnectionProfile.returns({name: '$default', type: 'web'});

            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('admin');
            mockIdCard2.getEnrollmentCredentials.returns({ });
            mockIdCard2.getCredentials.returns({certificate: 'CERTIFICATE', privateKey: 'PRIVATE_KEY'});
            mockIdCard2.getConnectionProfile.returns({name: 'hlfv1'});

            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('admin');
            mockIdCard3.getEnrollmentCredentials.returns({ });
            mockIdCard3.getCredentials.returns({});
            mockIdCard3.getConnectionProfile.returns({name: 'hlfv1'});

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
        });

        it('should activate an unused identity card with no credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            // service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            service['activateIdentityCard']('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((result: string) => {
                result.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            });

            tick();

            mockAdminService.importIdentity.should.not.have.been.called;
            mockConnectionProfileService.createProfile.should.have.been.calledWith('web-$default');
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {});
        })));

        it('should activate an unused identity card with credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            // service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            mockIdentityCardStorageService.get.withArgs('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            service['activateIdentityCard']('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((result: string) => {
                result.should.equal('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            });

            tick();

            mockAdminService.importIdentity.should.have.been.called;
            mockConnectionProfileService.createProfile.should.have.been.calledWith(sinon.match(/^.{40}-hlfv1$/));
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {});
        })));

        it('should not activate a used identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns();
            service['idCards'] = mockCardMap;

            service['activateIdentityCard']('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((result) => {
                should.not.exist(result);
            });

            tick();

            mockAdminService.importIdentity.should.not.have.been.called;
            mockConnectionProfileService.createProfile.should.not.have.been.called;
            mockIdentityCardStorageService.set.should.not.have.been.called;
        })));

        it('should give an error when activating an identity card with no enrollment secret and no credentials', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            service['activateIdentityCard']('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((result) => {
                should.not.exist(result);
            }).catch((reason) => {
                reason.message.should.equal('No credentials or enrollment secret available. An identity card must contain either a certificate and private key, or an enrollment secret');
            });

            tick();

            mockAdminService.importIdentity.should.not.have.been.called;
            mockConnectionProfileService.createProfile.should.not.have.been.called;
        })));
    });

    describe('getIdentityCardRefsWithProfileAndRole', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('card1');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);
            mockIdCard1.getRoles.returns(['myRole']);

            mockConnectionProfile2 = {name: 'myOtherProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('card2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);
            mockIdCard2.getRoles.returns(['myOtherRole']);

            mockConnectionProfile3 = {name: 'myProfile'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('card3');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);
            mockIdCard3.getRoles.returns(['myRole']);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
        });

        it('should get an identity card with matching profile and role', inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdCard3.getRoles.returns(['myOtherRole']);
            service['idCards'] = mockCardMap;

            let connectionProfileName = hash(mockConnectionProfile1) + '-myProfile';
            let result = service.getIdentityCardRefsWithProfileAndRole(connectionProfileName, 'myRole');

            result.length.should.equal(1);
            result[0].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should get all identity cards with matching profile and role', inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdCard2.getRoles.returns(['myRole']);
            service['idCards'] = mockCardMap;

            let connectionProfileName = hash(mockConnectionProfile1) + '-myProfile';
            let result = service.getIdentityCardRefsWithProfileAndRole(connectionProfileName, 'myRole');

            result.length.should.equal(2);
            result[0].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            result[1].should.equal('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should not get an identity card if there were no matching connection profiles', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let result = service.getIdentityCardRefsWithProfileAndRole('wotNoProfile', 'myRole');

            result.should.be.empty;
        }));

        it('should not get an identity card if there were no matching roles', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let result = service.getIdentityCardRefsWithProfileAndRole('myProfile', 'wotNoRole');

            result.should.be.empty;
        }));
    });

    describe('getQualifiedProfileName', () => {
        it('should get a qualified profile name for a web connection profile', inject([IdentityCardService], (service: IdentityCardService) => {
            let connectionProfile = {
                name: '$default',
                type: 'web'
            };

            let qualifiedName = service.getQualifiedProfileName(connectionProfile);

            qualifiedName.should.equal('web-$default');
        }));

        it('should get a qualified profile name for other connection profiles', inject([IdentityCardService], (service: IdentityCardService) => {
            let connectionProfile = {
                name: 'hlfv1'
            };

            let qualifiedName = service.getQualifiedProfileName(connectionProfile);

            qualifiedName.should.equal(hash(connectionProfile) + '-hlfv1');
        }));
    });

    describe('getCardRefFromIdentity', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockIdCard4;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockConnectionProfile4;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('myId');
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different id
            mockConnectionProfile2 = {name: 'myProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('myId2');
            mockIdCard2.getBusinessNetworkName.returns('myNetwork');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            // different profile
            mockConnectionProfile3 = {name: 'myProfile2'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('myId1');
            mockIdCard3.getBusinessNetworkName.returns('myNetwork');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);

            // different network
            mockConnectionProfile4 = {name: 'myProfile'};
            mockIdCard4 = sinon.createStubInstance(IdCard);
            mockIdCard4.getUserName.returns('myId');
            mockIdCard4.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard4.getConnectionProfile.returns(mockConnectionProfile4);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
            mockCardMap.set('uuid4xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard4);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get a card ref from an identity', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getCardRefFromIdentity('myId', 'myNetwork', qpn);

            result.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));
    });

    describe('getAllCardsForBusinessNetwork', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different network
            mockConnectionProfile2 = {name: 'myProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            // different profile
            mockConnectionProfile3 = {name: 'myProfile2'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getBusinessNetworkName.returns('myNetwork');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get all the cards for a business network', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;
            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getAllCardsForBusinessNetwork('myNetwork', qpn);

            result.size.should.equal(1);

            let mapIter = result.keys();

            mapIter.next().value.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));
    });

    describe('getAllCardRefsForProfile', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different profile
            mockConnectionProfile2 = {name: 'myProfile2'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get all the cards for a profile', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;
            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getAllCardRefsForProfile(qpn);

            result.should.deep.equal(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
        }));
    });
});
