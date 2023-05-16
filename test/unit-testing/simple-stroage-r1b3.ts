import {
  DAO,
  SimpleStorageR1B3,
  SimpleStorageR1B3__factory,
} from '../../typechain';
import {
  AccountStoredEvent,
  NumberStoredEvent,
} from '../../typechain/contracts/release1/build3/SimpleStorageR1B3';
import {findEvent} from '../../utils/helpers';
import {deployWithProxy} from '../../utils/helpers';
import {deployTestDao} from '../helpers/test-dao';
import {
  ADDRESS_TWO,
  STORE_ACCOUNT_PERMISSION_ID,
  STORE_NUMBER_PERMISSION_ID,
} from './simple-storage-common';
import {defaultInputR1B2} from './simple-stroage-r1b2';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export type InputR1B3 = {number: BigNumber; account: string};
export const defaultInputR1B3: InputR1B3 = defaultInputR1B2;

describe('SimpleStorageR1B3', async function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let SimpleStorageR1B3: SimpleStorageR1B3__factory;
  let simpleStorageR1B3: SimpleStorageR1B3;

  let defaultInput: InputR1B3;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    defaultInput = {
      number: BigNumber.from(123),
      account: signers[0].address,
    };

    SimpleStorageR1B3 = new SimpleStorageR1B3__factory(signers[0]);
  });

  beforeEach(async () => {
    simpleStorageR1B3 = await deployWithProxy<SimpleStorageR1B3>(
      SimpleStorageR1B3
    );
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await simpleStorageR1B3.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );

      await expect(
        simpleStorageR1B3.initialize(
          dao.address,
          defaultInput.number,
          defaultInput.account
        )
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('stores the number and account and emits the NumberStored and AccountStored events', async () => {
      const tx = await simpleStorageR1B3.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );

      // Check events
      const numberStoredEvent = await findEvent<NumberStoredEvent>(
        tx,
        'NumberStored'
      );
      expect(numberStoredEvent?.args.number).to.be.equal(defaultInput.number);

      const accountStoredEvent = await findEvent<AccountStoredEvent>(
        tx,
        'AccountStored'
      );
      expect(accountStoredEvent?.args.account).to.be.equal(
        defaultInput.account
      );

      // Check storage
      expect(await simpleStorageR1B3.number()).to.equal(defaultInput.number);
      expect(await simpleStorageR1B3.account()).to.equal(defaultInput.account);
    });
  });

  describe('storing', async () => {
    const newNumber = BigNumber.from(456);
    const newAccount = ADDRESS_TWO;

    beforeEach(async () => {
      await simpleStorageR1B3.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );
    });

    describe('storeNumber', async () => {
      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorageR1B3.storeNumber(newNumber))
          .to.be.revertedWithCustomError(SimpleStorageR1B3, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorageR1B3.address,
            signers[0].address,
            STORE_NUMBER_PERMISSION_ID
          );
      });

      it('stores the number and emits the NumberStored event', async () => {
        await dao.grant(
          simpleStorageR1B3.address,
          signers[0].address,
          STORE_NUMBER_PERMISSION_ID
        );

        const tx = await simpleStorageR1B3.storeNumber(newNumber);

        // Check event
        const numberStoredEvent = await findEvent<NumberStoredEvent>(
          tx,
          'NumberStored'
        );
        expect(numberStoredEvent?.args.number).to.be.equal(newNumber);

        // Check storage
        expect(await simpleStorageR1B3.number()).to.equal(newNumber);
      });
    });

    describe('storeAccount', async () => {
      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorageR1B3.storeAccount(newAccount))
          .to.be.revertedWithCustomError(SimpleStorageR1B3, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorageR1B3.address,
            signers[0].address,
            STORE_ACCOUNT_PERMISSION_ID
          );
      });

      it('stores the account and emits the AccountStored event', async () => {
        await dao.grant(
          simpleStorageR1B3.address,
          signers[0].address,
          STORE_ACCOUNT_PERMISSION_ID
        );

        const tx = await simpleStorageR1B3.storeAccount(newAccount);

        // Check event
        const accountStoredEvent = await findEvent<AccountStoredEvent>(
          tx,
          'AccountStored'
        );
        expect(accountStoredEvent?.args.account).to.be.equal(newAccount);

        // Check storage
        expect(await simpleStorageR1B3.account()).to.equal(newAccount);
      });
    });
  });
});
