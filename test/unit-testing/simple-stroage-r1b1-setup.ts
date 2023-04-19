import buildMetadata1 from '../../contracts/release1/build1/build-metadata.json';
import {
  DAO,
  SimpleStorageR1B1Setup,
  SimpleStorageR1B1Setup__factory,
  SimpleStorageR1B1__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation} from '../helpers/types';
import {
  ADDRESS_ZERO,
  EMPTY_DATA,
  NO_CONDITION,
  STORE_PERMISSION_ID,
  abiCoder,
} from './simple-storage-common';
import {defaultInputR1B1} from './simple-stroage-r1b1';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('SimpleStorageR1B1Setup', function () {
  let signers: SignerWithAddress[];
  let simpleStorageR1B1Setup: SimpleStorageR1B1Setup;
  let SimpleStorageR1B1Setup: SimpleStorageR1B1Setup__factory;
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    SimpleStorageR1B1Setup = new SimpleStorageR1B1Setup__factory(signers[0]);
    simpleStorageR1B1Setup = await SimpleStorageR1B1Setup.deploy();
  });

  describe('prepareInstallation', async () => {
    let initData: string;

    before(async () => {
      initData = abiCoder.encode(
        buildMetadata1.pluginSetupABI.prepareInstallation,
        [defaultInputR1B1.number]
      );
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(
        simpleStorageR1B1Setup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: simpleStorageR1B1Setup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await simpleStorageR1B1Setup.callStatic.prepareInstallation(
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

      await simpleStorageR1B1Setup.prepareInstallation(dao.address, initData);
      const simpleStorageR1B1 = new SimpleStorageR1B1__factory(
        signers[0]
      ).attach(plugin);

      // initialization is correct
      expect(await simpleStorageR1B1.dao()).to.eq(dao.address);
      expect(await simpleStorageR1B1.number()).to.be.eq(
        defaultInputR1B1.number
      );
    });
  });

  describe('prepareUninstallation', async () => {
    it('returns the permissions', async () => {
      const dummyAddr = ADDRESS_ZERO;

      const permissions =
        await simpleStorageR1B1Setup.callStatic.prepareUninstallation(
          dao.address,
          {
            plugin: dummyAddr,
            currentHelpers: [],
            data: EMPTY_DATA,
          }
        );

      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          dummyAddr,
          dao.address,
          NO_CONDITION,
          STORE_PERMISSION_ID,
        ],
      ]);
    });
  });
});
