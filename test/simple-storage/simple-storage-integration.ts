import buildMetadata1 from '../../contracts/release1/build1/build-metadata.json';
import buildMetadata2 from '../../contracts/release1/build2/build-metadata.json';
import buildMetadata3 from '../../contracts/release1/build3/build-metadata.json';
import releaseMetadata1 from '../../contracts/release1/release-metadata.json';
import {
  DAO,
  PluginRepo,
  PluginSetupProcessor,
  SimpleStorageR1B1,
  SimpleStorageR1B1Setup,
  SimpleStorageR1B1Setup__factory,
  SimpleStorageR1B1__factory,
  SimpleStorageR1B2,
  SimpleStorageR1B2Setup,
  SimpleStorageR1B2Setup__factory,
  SimpleStorageR1B2__factory,
  SimpleStorageR1B3,
  SimpleStorageR1B3Setup,
  SimpleStorageR1B3Setup__factory,
  SimpleStorageR1B3__factory,
} from '../../typechain';
import {PluginSetupRefStruct} from '../../typechain/@aragon/osx/framework/plugin/setup/PluginSetupProcessor';
import {findEventTopicLog, osxContracts} from '../../utils/helpers';
import {toHex, uploadToIPFS} from '../../utils/ipfs-upload';
import {installPLugin, uninstallPLugin, updatePlugin} from '../helpers/setup';
import {deployTestDao} from '../helpers/test-dao';
import {createPluginSetupProcessor} from '../helpers/test-psp';
import {ADDRESS_ONE} from './simple-storage-common';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

describe('SimpleStorage Integration', function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let pluginRepo: PluginRepo;
  let psp: PluginSetupProcessor;

  let simpleStorageR1B1Setup: SimpleStorageR1B1Setup;
  let simpleStorageR1B2Setup: SimpleStorageR1B2Setup;
  let simpleStorageR1B3Setup: SimpleStorageR1B3Setup;

  let pluginSetupRefR1B1: PluginSetupRefStruct;
  let pluginSetupRefR1B2: PluginSetupRefStruct;
  let pluginSetupRefR1B3: PluginSetupRefStruct;

  before(async () => {
    signers = await ethers.getSigners();

    // Deploy DAO.
    dao = await deployTestDao(signers[0]);

    // Deploy setups.
    simpleStorageR1B1Setup = await new SimpleStorageR1B1Setup__factory(
      signers[0]
    ).deploy();
    simpleStorageR1B2Setup = await new SimpleStorageR1B2Setup__factory(
      signers[0]
    ).deploy();
    simpleStorageR1B3Setup = await new SimpleStorageR1B3Setup__factory(
      signers[0]
    ).deploy();

    // Create the plugin repo
    pluginRepo = await populateSimpleStoragePluginRepo(
      signers[0],
      osxContracts.mainnet.PluginRepoFactory,
      'simple-storage',
      [
        simpleStorageR1B1Setup.address,
        simpleStorageR1B2Setup.address,
        simpleStorageR1B3Setup.address,
      ]
    );

    pluginSetupRefR1B1 = {
      versionTag: {
        release: BigNumber.from(1),
        build: BigNumber.from(1),
      },
      pluginSetupRepo: pluginRepo.address,
    };
    pluginSetupRefR1B2 = {
      versionTag: {
        release: BigNumber.from(1),
        build: BigNumber.from(2),
      },
      pluginSetupRepo: pluginRepo.address,
    };
    pluginSetupRefR1B3 = {
      versionTag: {
        release: BigNumber.from(1),
        build: BigNumber.from(3),
      },
      pluginSetupRepo: pluginRepo.address,
    };

    psp = await createPluginSetupProcessor(signers[0], dao);

    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_INSTALLATION_PERMISSION_ID()
    );
    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_UPDATE_PERMISSION_ID()
    );
    await dao.grant(
      dao.address,
      psp.address,
      await psp.APPLY_UNINSTALLATION_PERMISSION_ID()
    );
  });

  context('Release 1', async () => {
    context('Build 1', async () => {
      let plugin: SimpleStorageR1B1;

      beforeEach(async () => {
        // Install build 1.
        const results = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B1,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata1.pluginSetupABI.prepareInstallation,
            [123]
          )
        );

        plugin = new SimpleStorageR1B1__factory(signers[0]).attach(
          results.preparedEvent.args.plugin
        );
      });

      it('installs & uninstalls', async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(
          await simpleStorageR1B1Setup.implementation()
        );

        // Check state.
        expect(await plugin.number()).to.eq(123);

        // Uninstall build 1.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B1,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata1.pluginSetupABI.prepareUninstallation,
            []
          ),
          []
        );
      });
    });

    context('Build 2', async () => {
      let plugin: SimpleStorageR1B2;

      beforeEach(async () => {
        // Install build 2.

        const results = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata2.pluginSetupABI.prepareInstallation,
            [123, ADDRESS_ONE]
          )
        );

        plugin = new SimpleStorageR1B2__factory(signers[0]).attach(
          results.preparedEvent.args.plugin
        );
      });

      it('installs & uninstalls', async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(
          await simpleStorageR1B2Setup.implementation()
        );

        // Check state.
        expect(await plugin.number()).to.eq(123);
        expect(await plugin.account()).to.eq(ADDRESS_ONE);

        // Uninstall build 2.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata2.pluginSetupABI.prepareUninstallation,
            []
          ),
          []
        );
      });

      it('updates from build 1', async () => {
        // Install build 1.
        const results = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B1,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata1.pluginSetupABI.prepareInstallation,
            [123]
          )
        );
        const plugin = new SimpleStorageR1B1__factory(signers[0]).attach(
          results.preparedEvent.args.plugin
        );

        // Grant permission to upgrade.
        await dao.grant(
          plugin.address,
          psp.address,
          await plugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        // Update to build 2.
        await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B1,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata2.pluginSetupABI.prepareUpdate.fromBuild1,
            [ADDRESS_ONE]
          )
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B2__factory(signers[0]).attach(
          plugin.address
        );

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(
          await simpleStorageR1B2Setup.implementation()
        );

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);
      });
    });

    context('Build 3', async () => {
      let plugin: SimpleStorageR1B3;

      beforeEach(async () => {
        // Install build 3.
        const results = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata3.pluginSetupABI.prepareInstallation,
            [123, ADDRESS_ONE]
          )
        );

        plugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          results.preparedEvent.args.plugin
        );
      });

      it('installs & uninstalls', async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(
          await simpleStorageR1B3Setup.implementation()
        );

        // Check state.
        expect(await plugin.number()).to.eq(123);
        expect(await plugin.account()).to.eq(ADDRESS_ONE);

        // Uninstall build 3.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata3.pluginSetupABI.prepareUninstallation,
            []
          ),
          []
        );
      });

      it('updates from build 1', async () => {
        // Install build 1.
        const installResults = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B1,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata1.pluginSetupABI.prepareInstallation,
            [123]
          )
        );

        plugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          installResults.preparedEvent.args.plugin
        );

        // Grant permission to upgrade.
        await dao.grant(
          plugin.address,
          psp.address,
          await plugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        // Update to build 3.
        const updateResults = await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B1,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata2.pluginSetupABI.prepareUpdate.fromBuild1,
            [ADDRESS_ONE]
          )
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          plugin.address
        );

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(
          await simpleStorageR1B3Setup.implementation()
        );

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);

        // Check events.
        const numberStoredEvent = await findEventTopicLog(
          updateResults.applyTx,
          updatedPlugin.interface,
          'NumberStored'
        );
        expect(numberStoredEvent.args.number).to.equal(123);
        const accountStoredEvent = await findEventTopicLog(
          updateResults.applyTx,
          updatedPlugin.interface,
          'AccountStored'
        );
        expect(accountStoredEvent.args.account).to.equal(ADDRESS_ONE);
      });

      it('updates from build 2', async () => {
        // Install build 2.
        const installResults = await installPLugin(
          psp,
          dao,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata2.pluginSetupABI.prepareInstallation,
            [123, ADDRESS_ONE]
          )
        );

        plugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          installResults.preparedEvent.args.plugin
        );

        // Grant permission to upgrade.
        await dao.grant(
          plugin.address,
          psp.address,
          await plugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        // Update to build 3.
        const updateResults = await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B2,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(
            buildMetadata3.pluginSetupABI.prepareUpdate.fromBuild2,
            []
          )
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          plugin.address
        );

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(
          await simpleStorageR1B3Setup.implementation()
        );

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);

        // Check events.
        const numberStoredEvent = await findEventTopicLog(
          updateResults.applyTx,
          updatedPlugin.interface,
          'NumberStored'
        );
        expect(numberStoredEvent.args.number).to.equal(123);
        const accountStoredEvent = await findEventTopicLog(
          updateResults.applyTx,
          updatedPlugin.interface,
          'AccountStored'
        );
        expect(accountStoredEvent.args.account).to.equal(ADDRESS_ONE);
      });
    });
  });
});

export async function populateSimpleStoragePluginRepo(
  signer: SignerWithAddress,
  pluginRepoFactory: string,
  repoEnsName: string,
  setups: string[]
): Promise<PluginRepo> {
  const pluginRepoFactoryContract = new PluginRepoFactory__factory(
    signer
  ).attach(pluginRepoFactory);

  // Upload the metadata
  const metadata = {
    Release1: {
      URI: `ipfs://${await uploadToIPFS(JSON.stringify(releaseMetadata1))}`,

      Build1: {
        URI: `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata1))}`,
      },
      Build2: {
        URI: `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata2))}`,
      },
      Build3: {
        URI: `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata3))}`,
      },
    },
  };

  // Create Repo for Release 1 and Build 1
  const tx = await pluginRepoFactoryContract.createPluginRepoWithFirstVersion(
    repoEnsName,
    setups[0],
    signer.address,
    toHex(metadata.Release1.Build1.URI),
    toHex(metadata.Release1.URI)
  );

  const eventLog = await findEventTopicLog(
    tx,
    PluginRepoRegistry__factory.createInterface(),
    'PluginRepoRegistered'
  );
  if (!eventLog) {
    throw new Error('Failed to get PluginRepoRegistered event log');
  }

  const pluginRepo = new PluginRepo__factory(signer).attach(
    eventLog.args.pluginRepo
  );

  // Create Version for Release 1 and Build 2
  await pluginRepo.createVersion(
    1,
    setups[1],
    toHex(metadata.Release1.Build2.URI),
    toHex(metadata.Release1.URI)
  );

  // Create Version for Release 1 and Build 3
  await pluginRepo.createVersion(
    1,
    setups[2],
    toHex(metadata.Release1.Build3.URI),
    toHex(metadata.Release1.URI)
  );

  return pluginRepo;
}
