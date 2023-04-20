import buildMetadata2 from '../../contracts/release1/build2/build-metadata.json';
import {
  DAO,
  SimpleStorageR1B1,
  SimpleStorageR1B1__factory,
  SimpleStorageR1B2Setup,
  SimpleStorageR1B2Setup__factory,
  SimpleStorageR1B2__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation} from '../helpers/types';
import {
  ADDRESS_ONE,
  EMPTY_DATA,
  NO_CONDITION,
  STORE_PERMISSION_ID,
  abiCoder,
} from './simple-storage-common';
import {defaultInputR1B2} from './simple-stroage-r1b2';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('SimpleStorageR1B2Setup', function () {
  let signers: SignerWithAddress[];
  let simpleStorageR1B2Setup: SimpleStorageR1B2Setup;
  let SimpleStorageR1B2Setup: SimpleStorageR1B2Setup__factory;
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    SimpleStorageR1B2Setup = new SimpleStorageR1B2Setup__factory(signers[0]);
    simpleStorageR1B2Setup = await SimpleStorageR1B2Setup.deploy();
  });

  describe('prepareInstallation', async () => {
    let initData: string;

    before(async () => {
      initData = abiCoder.encode(
        buildMetadata2.pluginSetupABI.prepareInstallation,
        [defaultInputR1B2.number, defaultInputR1B2.account]
      );
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(
        simpleStorageR1B2Setup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: simpleStorageR1B2Setup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await simpleStorageR1B2Setup.callStatic.prepareInstallation(
        dao.address,
        initData
      );

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_PERMISSION_ID,
        ],
      ]);

      await simpleStorageR1B2Setup.prepareInstallation(dao.address, initData);
      const simpleStorageR1B2 = new SimpleStorageR1B2__factory(
        signers[0]
      ).attach(plugin);

      // initialization is correct
      expect(await simpleStorageR1B2.dao()).to.eq(dao.address);
      expect(await simpleStorageR1B2.number()).to.be.eq(
        defaultInputR1B2.number
      );
      expect(await simpleStorageR1B2.number()).to.be.eq(
        defaultInputR1B2.number
      );
    });
  });

  describe('prepareUninstallation', async () => {
    it('returns the permissions', async () => {
      const plugin = ethers.Wallet.createRandom().address;

      const permissions =
        await simpleStorageR1B2Setup.callStatic.prepareUninstallation(
          dao.address,
          {
            plugin,
            currentHelpers: [],
            data: EMPTY_DATA,
          }
        );

      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_PERMISSION_ID,
        ],
      ]);
    });
  });

  describe('prepareUpdate', async () => {
    let pluginBuild1: SimpleStorageR1B1;

    before(async () => {
      pluginBuild1 = await new SimpleStorageR1B1__factory(signers[0]).deploy();
    });

    context('from build 1', async () => {
      it('returns the permissions', async () => {
        const currentBuildNumber = 1;
        const {initData, preparedSetupData} =
          await simpleStorageR1B2Setup.callStatic.prepareUpdate(
            dao.address,
            currentBuildNumber,
            {
              plugin: pluginBuild1.address,
              currentHelpers: [],
              data: ethers.utils.defaultAbiCoder.encode(
                buildMetadata2.pluginSetupABI.prepareUpdate.fromBuild1,
                [ADDRESS_ONE]
              ),
            }
          );

        const expectedInitData =
          SimpleStorageR1B2__factory.createInterface().encodeFunctionData(
            'initializeFromBuild1',
            [ADDRESS_ONE]
          );

        expect(initData).to.be.equal(expectedInitData);
        expect(preparedSetupData.permissions.length).to.be.equal(0);
        expect(preparedSetupData.helpers.length).to.be.equal(0);
      });
    });
  });
});
