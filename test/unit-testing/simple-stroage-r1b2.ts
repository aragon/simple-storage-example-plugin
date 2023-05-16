import {
  DAO,
  SimpleStorageR1B2,
  SimpleStorageR1B2__factory,
} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {deployTestDao} from '../helpers/test-dao';
import {
  ADDRESS_ONE,
  ADDRESS_TWO,
  STORE_PERMISSION_ID,
} from './simple-storage-common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export type InputR1B2 = {number: BigNumber; account: string};
export const defaultInputR1B2: InputR1B2 = {
  number: BigNumber.from(123),
  account: ADDRESS_ONE,
};

describe('SimpleStorageR1B2', async function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let SimpleStorageR1B2: SimpleStorageR1B2__factory;
  let simpleStorageR1B2: SimpleStorageR1B2;

  let defaultInput: InputR1B2;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    defaultInput = {
      number: BigNumber.from(123),
      account: signers[0].address,
    };

    SimpleStorageR1B2 = new SimpleStorageR1B2__factory(signers[0]);
  });

  beforeEach(async () => {
    simpleStorageR1B2 = await deployWithProxy<SimpleStorageR1B2>(
      SimpleStorageR1B2
    );
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await simpleStorageR1B2.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );

      await expect(
        simpleStorageR1B2.initialize(
          dao.address,
          defaultInput.number,
          defaultInput.account
        )
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('stores the number and account', async () => {
      await simpleStorageR1B2.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );

      expect(await simpleStorageR1B2.number()).to.equal(defaultInput.number);
      expect(await simpleStorageR1B2.account()).to.equal(defaultInput.account);
    });
  });

  describe('storing', async () => {
    const newNumber = BigNumber.from(456);
    const newAccount = ADDRESS_TWO;

    beforeEach(async () => {
      await simpleStorageR1B2.initialize(
        dao.address,
        defaultInput.number,
        defaultInput.account
      );
    });

    describe('storeAccount', async () => {
      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorageR1B2.storeNumber(newNumber))
          .to.be.revertedWithCustomError(SimpleStorageR1B2, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorageR1B2.address,
            signers[0].address,
            STORE_PERMISSION_ID
          );
      });

      it('stores the number', async () => {
        await dao.grant(
          simpleStorageR1B2.address,
          signers[0].address,
          STORE_PERMISSION_ID
        );

        await expect(simpleStorageR1B2.storeNumber(newNumber)).to.not.be
          .reverted;
        expect(await simpleStorageR1B2.number()).to.equal(newNumber);
      });
    });

    describe('storeAccount', async () => {
      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorageR1B2.storeAccount(newAccount))
          .to.be.revertedWithCustomError(SimpleStorageR1B2, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorageR1B2.address,
            signers[0].address,
            STORE_PERMISSION_ID
          );
      });

      it('stores the account', async () => {
        await dao.grant(
          simpleStorageR1B2.address,
          signers[0].address,
          STORE_PERMISSION_ID
        );

        await expect(simpleStorageR1B2.storeAccount(newAccount)).to.not.be
          .reverted;
        expect(await simpleStorageR1B2.account()).to.equal(newAccount);
      });
    });
  });
});
