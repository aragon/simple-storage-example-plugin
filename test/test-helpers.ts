import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { Interface, LogDescription, defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { DAO, IPlugin, PluginSetupProcessor } from "../types";
import {
  InstallationPreparedEvent,
  UninstallationPreparedEvent,
  UpdateAppliedEvent,
  UpdatePreparedEvent,
} from "../types//@aragon/osx/framework/plugin/setup/PluginSetupProcessor";
import { PluginSetupRef } from "./simple-storage/types";

export const ERRORS = {
  ALREADY_INITIALIZED: "Initializable: contract is already initialized",
};

export function toBytes(string: string) {
  return ethers.utils.formatBytes32String(string);
}

export function hashHelpers(helpers: string[]) {
  return keccak256(defaultAbiCoder.encode(["address[]"], [helpers]));
}

export async function findEvent<T>(tx: ContractTransaction, eventName: string) {
  const receipt = await tx.wait();

  const event = (receipt.events || []).find((event) => event.event === eventName);

  return event as T | undefined;
}

export async function findEventTopicLog(
  tx: ContractTransaction,
  iface: Interface,
  eventName: string,
): Promise<LogDescription> {
  const receipt = await tx.wait();
  const topic = iface.getEventTopic(eventName);
  const log = receipt.logs.find((x) => x.topics.indexOf(topic) >= 0);
  if (!log) {
    throw new Error(`No logs found for this event ${eventName} topic.`);
  }
  return iface.parseLog(log);
}

// This is to remove unnecessary properties from the output type. Use it eg. `ExtractPropsFromArray<Inventory.ItemStructOutput>`
export type ExtractPropsFromArray<T> = Omit<T, keyof Array<unknown> | `${number}`>;

export async function getTime(): Promise<number> {
  return (await ethers.provider.getBlock("latest")).timestamp;
}

export async function advanceTime(time: number) {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine", []);
}

export async function advanceTimeTo(timestamp: number) {
  const delta = timestamp - (await getTime());
  await advanceTime(delta);
}

export async function installPLugin(
  psp: PluginSetupProcessor,
  dao: DAO,
  pluginSetupRef: PluginSetupRef,
  data: string,
): Promise<string> {
  const tx = await psp.prepareInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    data: data,
  });

  const preparedEvent = await findEvent<InstallationPreparedEvent>(tx, "InstallationPrepared");
  if (!preparedEvent) {
    throw new Error("Failed to get InstallationPrepared event");
  }

  await expect(
    psp.applyInstallation(dao.address, {
      pluginSetupRef: pluginSetupRef,
      plugin: preparedEvent.args.plugin,
      permissions: preparedEvent.args.preparedSetupData.permissions,
      helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
    }),
  ).to.emit(psp, "InstallationApplied");

  return preparedEvent.args.plugin;
}

export async function uninstallPLugin(
  psp: PluginSetupProcessor,
  dao: DAO,
  plugin: IPlugin,
  pluginSetupRef: PluginSetupRef,
  data: string,
  currentHelpers: string[],
) {
  const tx = await psp.prepareUninstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    setupPayload: {
      plugin: plugin.address,
      currentHelpers: currentHelpers,
      data: data,
    },
  });

  const preparedEvent = await findEvent<UninstallationPreparedEvent>(tx, "UninstallationPrepared");
  if (!preparedEvent) {
    throw new Error("Failed to get UninstallationPrepared event");
  }

  const preparedPermissions = preparedEvent.args.permissions;

  await expect(
    psp.applyUninstallation(dao.address, {
      plugin: plugin.address,
      pluginSetupRef: pluginSetupRef,
      permissions: preparedPermissions,
    }),
  ).to.emit(psp, "UninstallationApplied");
}

export async function updatePlugin(
  psp: PluginSetupProcessor,
  dao: DAO,
  plugin: IPlugin,
  currentHelpers: string[],
  pluginSetupRefCurrent: PluginSetupRef,
  pluginSetupRefUpdate: PluginSetupRef,
  data: string,
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
}> {
  expect(pluginSetupRefCurrent.pluginSetupRepo).to.equal(pluginSetupRefUpdate.pluginSetupRepo);

  const prepareTx = await psp.prepareUpdate(dao.address, {
    currentVersionTag: pluginSetupRefCurrent.versionTag,
    newVersionTag: pluginSetupRefUpdate.versionTag,
    pluginSetupRepo: pluginSetupRefUpdate.pluginSetupRepo,
    setupPayload: {
      plugin: plugin.address,
      currentHelpers: currentHelpers,
      data: data,
    },
  });
  const preparedEvent = await findEvent<UpdatePreparedEvent>(prepareTx, "UpdatePrepared");
  if (!preparedEvent) {
    throw new Error("Failed to get UpdatePrepared event");
  }

  const applyTx = await psp.applyUpdate(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRefUpdate,
    initData: preparedEvent.args.initData,
    permissions: preparedEvent.args.preparedSetupData.permissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });
  const appliedEvent = await findEvent<UpdateAppliedEvent>(applyTx, "UpdateApplied");
  if (!appliedEvent) {
    throw new Error("Failed to get UpdateApplied event");
  }

  return { prepareTx, applyTx };
}
