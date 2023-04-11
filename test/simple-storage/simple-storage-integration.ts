import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import buildMetadata1 from "../../contracts/release1/build1/build-metadata.json";
import buildMetadata2 from "../../contracts/release1/build2/build-metadata.json";
import buildMetadata3 from "../../contracts/release1/build3/build-metadata.json";
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
} from "../../types";
import { createPluginRepo, createPluginSetupProcessor } from "../helpers/deploy-plugin-repo";
import { findEventTopicLog, installPLugin, uninstallPLugin, updatePlugin } from "../helpers/helpers";
import { deployDao } from "../helpers/test-dao";
import { PluginSetupRef } from "../helpers/types";
import { ADDRESS_ONE } from "./simple-storage-common";

describe("SimpleStorage Integration", function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let pluginRepo: PluginRepo;
  let psp: PluginSetupProcessor;

  let simpleStorageR1B1Setup: SimpleStorageR1B1Setup;
  let simpleStorageR1B2Setup: SimpleStorageR1B2Setup;
  let simpleStorageR1B3Setup: SimpleStorageR1B3Setup;

  let pluginSetupRefR1B1: PluginSetupRef;
  let pluginSetupRefR1B2: PluginSetupRef;
  let pluginSetupRefR1B3: PluginSetupRef;

  before(async () => {
    signers = await ethers.getSigners();

    // Deploy DAO.
    [dao] = await deployDao(signers[0]);

    // Deploy setups.
    simpleStorageR1B1Setup = await new SimpleStorageR1B1Setup__factory(signers[0]).deploy();
    simpleStorageR1B2Setup = await new SimpleStorageR1B2Setup__factory(signers[0]).deploy();
    simpleStorageR1B3Setup = await new SimpleStorageR1B3Setup__factory(signers[0]).deploy();

    // Create the plugin repo
    pluginRepo = await createPluginRepo(signers[0], "simple-storage", [
      simpleStorageR1B1Setup.address,
      simpleStorageR1B2Setup.address,
      simpleStorageR1B3Setup.address,
    ]);

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

    await dao.grant(dao.address, psp.address, await psp.APPLY_INSTALLATION_PERMISSION_ID());
    await dao.grant(dao.address, psp.address, await psp.APPLY_UPDATE_PERMISSION_ID());
    await dao.grant(dao.address, psp.address, await psp.APPLY_UNINSTALLATION_PERMISSION_ID());
  });

  context("Release 1", async () => {
    context("Build 1", async () => {
      let plugin: SimpleStorageR1B1;

      beforeEach(async () => {
        // Install build 1.
        plugin = new SimpleStorageR1B1__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B1,
            ethers.utils.defaultAbiCoder.encode(buildMetadata1.pluginSetupABI.prepareInstallation, [123]),
          ),
        );
      });

      it("installs & uninstalls", async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(await simpleStorageR1B1Setup.implementation());

        // Check state.
        expect(await plugin.number()).to.eq(123);

        // Uninstall build 1.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B1,
          ethers.utils.defaultAbiCoder.encode(buildMetadata1.pluginSetupABI.prepareUninstallation, []),
          [],
        );
      });
    });

    context("Build 2", async () => {
      let plugin: SimpleStorageR1B2;

      beforeEach(async () => {
        // Install build 2.
        plugin = new SimpleStorageR1B2__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B2,
            ethers.utils.defaultAbiCoder.encode(buildMetadata2.pluginSetupABI.prepareInstallation, [123, ADDRESS_ONE]),
          ),
        );
      });

      it("installs & uninstalls", async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(await simpleStorageR1B2Setup.implementation());

        // Check state.
        expect(await plugin.number()).to.eq(123);
        expect(await plugin.account()).to.eq(ADDRESS_ONE);

        // Uninstall build 2.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(buildMetadata2.pluginSetupABI.prepareUninstallation, []),
          [],
        );
      });

      it("updates from build 1", async () => {
        // Install build 1.
        const plugin = new SimpleStorageR1B1__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B1,
            ethers.utils.defaultAbiCoder.encode(buildMetadata1.pluginSetupABI.prepareInstallation, [123]),
          ),
        );

        // Grant permission to upgrade.
        await dao.grant(plugin.address, psp.address, await plugin.UPGRADE_PLUGIN_PERMISSION_ID());

        // Update to build 2.
        await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B1,
          pluginSetupRefR1B2,
          ethers.utils.defaultAbiCoder.encode(buildMetadata2.pluginSetupABI.prepareUpdate.fromBuild1, [ADDRESS_ONE]),
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B2__factory(signers[0]).attach(plugin.address);

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(await simpleStorageR1B2Setup.implementation());

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);
      });
    });

    context("Build 3", async () => {
      let plugin: SimpleStorageR1B3;

      beforeEach(async () => {
        // Install build 3.
        plugin = new SimpleStorageR1B3__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B3,
            ethers.utils.defaultAbiCoder.encode(buildMetadata3.pluginSetupABI.prepareInstallation, [123, ADDRESS_ONE]),
          ),
        );
      });

      it("installs & uninstalls", async () => {
        // Check implementation.
        expect(await plugin.implementation()).to.be.eq(await simpleStorageR1B3Setup.implementation());

        // Check state.
        expect(await plugin.number()).to.eq(123);
        expect(await plugin.account()).to.eq(ADDRESS_ONE);

        // Uninstall build 3.
        await uninstallPLugin(
          psp,
          dao,
          plugin,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(buildMetadata3.pluginSetupABI.prepareUninstallation, []),
          [],
        );
      });

      it("updates from build 1", async () => {
        // Install build 1.
        const plugin = new SimpleStorageR1B1__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B1,
            ethers.utils.defaultAbiCoder.encode(buildMetadata1.pluginSetupABI.prepareInstallation, [123]),
          ),
        );

        // Grant permission to upgrade.
        await dao.grant(plugin.address, psp.address, await plugin.UPGRADE_PLUGIN_PERMISSION_ID());

        // Update to build 3.
        const results = await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B1,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(buildMetadata2.pluginSetupABI.prepareUpdate.fromBuild1, [ADDRESS_ONE]),
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B3__factory(signers[0]).attach(plugin.address);

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(await simpleStorageR1B3Setup.implementation());

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);

        // Check events.
        const numberStoredEvent = await findEventTopicLog(results.applyTx, updatedPlugin.interface, "NumberStored");
        expect(numberStoredEvent.args.number).to.equal(123);
        const accountStoredEvent = await findEventTopicLog(results.applyTx, updatedPlugin.interface, "AccountStored");
        expect(accountStoredEvent.args.account).to.equal(ADDRESS_ONE);
      });

      it("updates from build 2", async () => {
        // Install build 2.
        const plugin = new SimpleStorageR1B2__factory(signers[0]).attach(
          await installPLugin(
            psp,
            dao,
            pluginSetupRefR1B2,
            ethers.utils.defaultAbiCoder.encode(buildMetadata2.pluginSetupABI.prepareInstallation, [123, ADDRESS_ONE]),
          ),
        );

        // Grant permission to upgrade.
        await dao.grant(plugin.address, psp.address, await plugin.UPGRADE_PLUGIN_PERMISSION_ID());

        // Update to build 3.
        const results = await updatePlugin(
          psp,
          dao,
          plugin,
          [],
          pluginSetupRefR1B2,
          pluginSetupRefR1B3,
          ethers.utils.defaultAbiCoder.encode(buildMetadata3.pluginSetupABI.prepareUpdate.fromBuild2, []),
        );

        // Get updated contract.
        const updatedPlugin = new SimpleStorageR1B3__factory(signers[0]).attach(plugin.address);

        // Check implementation.
        expect(await updatedPlugin.implementation()).to.be.eq(await simpleStorageR1B3Setup.implementation());

        // Check state.
        expect(await updatedPlugin.number()).to.eq(123);
        expect(await updatedPlugin.account()).to.eq(ADDRESS_ONE);

        // Check events.
        const numberStoredEvent = await findEventTopicLog(results.applyTx, updatedPlugin.interface, "NumberStored");
        expect(numberStoredEvent.args.number).to.equal(123);
        const accountStoredEvent = await findEventTopicLog(results.applyTx, updatedPlugin.interface, "AccountStored");
        expect(accountStoredEvent.args.account).to.equal(ADDRESS_ONE);
      });
    });
  });
});
