import {
  DAO,
  SimpleStorageR1B1,
  SimpleStorageR1B1__factory,
} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {deployTestDao} from '../helpers/test-dao';
import {STORE_PERMISSION_ID} from './simple-storage-common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export type InputR1B1 = {number: BigNumber};
export const defaultInputR1B1: InputR1B1 = {
  number: BigNumber.from(123),
};

describe('SimpleStorageR1B1', function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let SimpleStorageR1B1: SimpleStorageR1B1__factory;
  let simpleStorageR1B1: SimpleStorageR1B1;
  let defaultInput: InputR1B1;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    defaultInput = {number: BigNumber.from(123)};

    SimpleStorageR1B1 = new SimpleStorageR1B1__factory(signers[0]);
  });

  beforeEach(async () => {
    simpleStorageR1B1 = await deployWithProxy<SimpleStorageR1B1>(
      SimpleStorageR1B1
    );
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await simpleStorageR1B1.initialize(dao.address, defaultInput.number);

      await expect(
        simpleStorageR1B1.initialize(dao.address, defaultInput.number)
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('stores the number', async () => {
      await simpleStorageR1B1.initialize(dao.address, defaultInput.number);

      expect(await simpleStorageR1B1.number()).to.equal(defaultInput.number);
    });
  });

  describe('storing', async () => {
    describe('storeNumber', async () => {
      const newNumber = BigNumber.from(456);

      beforeEach(async () => {
        await simpleStorageR1B1.initialize(dao.address, defaultInput.number);
      });

      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorageR1B1.storeNumber(newNumber))
          .to.be.revertedWithCustomError(SimpleStorageR1B1, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorageR1B1.address,
            signers[0].address,
            STORE_PERMISSION_ID
          );
      });

      it('stores the number', async () => {
        await dao.grant(
          simpleStorageR1B1.address,
          signers[0].address,
          STORE_PERMISSION_ID
        );

        await expect(simpleStorageR1B1.storeNumber(newNumber)).to.not.be
          .reverted;
        expect(await simpleStorageR1B1.number()).to.equal(newNumber);
      });
    });
  });
});
