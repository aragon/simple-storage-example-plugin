import buildMetadata3 from '../../contracts/release1/build3/build-metadata.json';
import {
  DAO,
  SimpleStorageR1B1,
  SimpleStorageR1B1__factory,
  SimpleStorageR1B2,
  SimpleStorageR1B2__factory,
  SimpleStorageR1B3Setup,
  SimpleStorageR1B3Setup__factory,
  SimpleStorageR1B3__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation} from '../helpers/types';
import {
  ADDRESS_ONE,
  EMPTY_DATA,
  NO_CONDITION,
  STORE_ACCOUNT_PERMISSION_ID,
  STORE_NUMBER_PERMISSION_ID,
  STORE_PERMISSION_ID,
  abiCoder,
} from './simple-storage-common';
import {defaultInputR1B3} from './simple-stroage-r1b3';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

describe('SimpleStorageR1B3Setup', function () {
  let signers: SignerWithAddress[];
  let simpleStorageR1B3Setup: SimpleStorageR1B3Setup;
  let SimpleStorageR1B3Setup: SimpleStorageR1B3Setup__factory;
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    SimpleStorageR1B3Setup = new SimpleStorageR1B3Setup__factory(signers[0]);
    simpleStorageR1B3Setup = await SimpleStorageR1B3Setup.deploy();
  });

  describe('prepareInstallation', async () => {
    let initData: string;

    before(async () => {
      initData = abiCoder.encode(
        buildMetadata3.pluginSetupABI.prepareInstallation,
        [defaultInputR1B3.number, defaultInputR1B3.account]
      );
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(
        simpleStorageR1B3Setup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: simpleStorageR1B3Setup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await simpleStorageR1B3Setup.callStatic.prepareInstallation(
        dao.address,
        initData
      );

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(2);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_NUMBER_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_ACCOUNT_PERMISSION_ID,
        ],
      ]);

      await simpleStorageR1B3Setup.prepareInstallation(dao.address, initData);
      const simpleStorageR1B3 = new SimpleStorageR1B3__factory(
        signers[0]
      ).attach(plugin);

      // initialization is correct
      expect(await simpleStorageR1B3.dao()).to.eq(dao.address);
      expect(await simpleStorageR1B3.number()).to.be.eq(
        defaultInputR1B3.number
      );
      expect(await simpleStorageR1B3.number()).to.be.eq(
        defaultInputR1B3.number
      );
    });
  });

  describe('prepareUninstallation', async () => {
    it('returns the permissions', async () => {
      const plugin = ethers.Wallet.createRandom().address;

      const permissions =
        await simpleStorageR1B3Setup.callStatic.prepareUninstallation(
          dao.address,
          {
            plugin,
            currentHelpers: [],
            data: EMPTY_DATA,
          }
        );

      expect(permissions.length).to.be.equal(2);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_NUMBER_PERMISSION_ID,
        ],
        [
          Operation.Revoke,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_ACCOUNT_PERMISSION_ID,
        ],
      ]);
    });
  });

  describe('prepareUpdate', async () => {
    let currentBuildNumber: BigNumber;

    describe('from build 1', async () => {
      let pluginBuild1: SimpleStorageR1B1;

      before(async () => {
        currentBuildNumber = BigNumber.from(1);
        pluginBuild1 = await new SimpleStorageR1B1__factory(
          signers[0]
        ).deploy();
      });

      it('returns the permissions', async () => {
        const {initData, preparedSetupData} =
          await simpleStorageR1B3Setup.callStatic.prepareUpdate(
            dao.address,
            currentBuildNumber,
            {
              plugin: pluginBuild1.address,
              currentHelpers: [],
              data: ethers.utils.defaultAbiCoder.encode(
                buildMetadata3.pluginSetupABI.prepareUpdate.fromBuild1,
                [ADDRESS_ONE]
              ),
            }
          );

        const expectedInitData =
          SimpleStorageR1B3__factory.createInterface().encodeFunctionData(
            'initializeFromBuild1',
            [ADDRESS_ONE]
          );

        expect(initData).to.be.equal(expectedInitData);
        expect(preparedSetupData.permissions.length).to.be.equal(3);
        expect(preparedSetupData.permissions).to.deep.equal([
          [
            Operation.Revoke,
            dao.address,
            pluginBuild1.address,
            NO_CONDITION,
            STORE_PERMISSION_ID,
          ],
          [
            Operation.Grant,
            dao.address,
            pluginBuild1.address,
            NO_CONDITION,
            STORE_NUMBER_PERMISSION_ID,
          ],
          [
            Operation.Grant,
            dao.address,
            pluginBuild1.address,
            NO_CONDITION,
            STORE_ACCOUNT_PERMISSION_ID,
          ],
        ]);
      });
    });

    describe('from build 2', async () => {
      let pluginBuild2: SimpleStorageR1B2;

      before(async () => {
        currentBuildNumber = BigNumber.from(2);
        pluginBuild2 = await new SimpleStorageR1B2__factory(
          signers[0]
        ).deploy();
      });

      it('returns the permissions', async () => {
        const {initData, preparedSetupData} =
          await simpleStorageR1B3Setup.callStatic.prepareUpdate(
            dao.address,
            currentBuildNumber,
            {
              plugin: pluginBuild2.address,
              currentHelpers: [],
              data: ethers.utils.defaultAbiCoder.encode(
                buildMetadata3.pluginSetupABI.prepareUpdate.fromBuild2,
                []
              ),
            }
          );

        const expectedInitData =
          SimpleStorageR1B3__factory.createInterface().encodeFunctionData(
            'initializeFromBuild2'
          );

        expect(initData).to.be.equal(expectedInitData);
        expect(preparedSetupData.permissions.length).to.be.equal(3);
        expect(preparedSetupData.permissions).to.deep.equal([
          [
            Operation.Revoke,
            dao.address,
            pluginBuild2.address,
            NO_CONDITION,
            STORE_PERMISSION_ID,
          ],
          [
            Operation.Grant,
            dao.address,
            pluginBuild2.address,
            NO_CONDITION,
            STORE_NUMBER_PERMISSION_ID,
          ],
          [
            Operation.Grant,
            dao.address,
            pluginBuild2.address,
            NO_CONDITION,
            STORE_ACCOUNT_PERMISSION_ID,
          ],
        ]);
      });
    });
  });
});
