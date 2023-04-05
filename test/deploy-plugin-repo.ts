import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BytesLike } from "ethers";
import { ethers } from "hardhat";

import buildMetadata1 from "../contracts/release1/build1/build-metadata.json";
import buildMetadata2 from "../contracts/release1/build2/build-metadata.json";
import buildMetadata3 from "../contracts/release1/build3/build-metadata.json";
import releaseMetadata1 from "../contracts/release1/release-metadata.json";
import {
  DAO,
  PluginRepo,
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  PluginSetupProcessor,
  PluginSetupProcessor__factory,
} from "../types";
import { uploadToIPFS } from "./helpers";
import { Operation } from "./simple-storage/simple-storage-common";
import { findEventTopicLog } from "./test-helpers";

export type ReleaseMetadata = {
  metadata: string;
  builds: string[];
};

export type VersionMetadata = {
  releases: ReleaseMetadata[];
};

async function uploadMetadata(): Promise<VersionMetadata> {
  return {
    releases: [
      {
        metadata: `ipfs://${await uploadToIPFS(JSON.stringify(releaseMetadata1))}`,
        builds: [
          `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata1))}`,
          `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata2))}`,
          `ipfs://${await uploadToIPFS(JSON.stringify(buildMetadata3))}`,
        ],
      },
    ],
  };
}

function toHex(input: string): BytesLike {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input));
}

export async function createPluginRepo(
  signer: SignerWithAddress,
  repoEnsName: string,
  setups: string[],
): Promise<PluginRepo> {
  const pluginRepoFactory = new PluginRepoFactory__factory(signer).attach(
    "0x96E54098317631641703404C06A5afAD89da7373", // mainnet repo factory
  );

  const metadata = await uploadMetadata();

  // Create Repo for Release 1 and Build 1
  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    repoEnsName,
    setups[0],
    signer.address,
    toHex(metadata.releases[0].metadata),
    toHex(metadata.releases[0].builds[0]),
  );

  const eventLog = await findEventTopicLog(tx, PluginRepoRegistry__factory.createInterface(), "PluginRepoRegistered");
  if (!eventLog) {
    throw new Error("Failed to get PluginRepoRegistered event log");
  }

  const pluginRepo = new PluginRepo__factory(signer).attach(eventLog.args.pluginRepo);

  // Create Version for Release 1 and Build 2
  await pluginRepo.createVersion(
    1,
    setups[1],
    toHex(metadata.releases[0].builds[1]),
    toHex(metadata.releases[0].metadata),
  );

  // Create Version for Release 1 and Build 3
  await pluginRepo.createVersion(
    1,
    setups[2],
    toHex(metadata.releases[0].builds[2]),
    toHex(metadata.releases[0].metadata),
  );

  return pluginRepo;
}

export async function createPluginSetupProcessor(signer: SignerWithAddress, dao: DAO): Promise<PluginSetupProcessor> {
  // Create the PluginSetupProcessor
  const psp = new PluginSetupProcessor__factory(signer).attach("0xE978942c691e43f65c1B7c7F8f1dc8cDF061B13f");

  // grant the owner full permission for plugins
  await dao.applySingleTargetPermissions(psp.address, [
    {
      operation: Operation.Grant,
      who: signer.address,
      permissionId: await psp.APPLY_INSTALLATION_PERMISSION_ID(),
    },
    {
      operation: Operation.Grant,
      who: signer.address,
      permissionId: await psp.APPLY_UPDATE_PERMISSION_ID(),
    },
    {
      operation: Operation.Grant,
      who: signer.address,
      permissionId: await psp.APPLY_UNINSTALLATION_PERMISSION_ID(),
    },
  ]);
  // grant the PSP root to apply stuff
  await dao.grant(dao.address, psp.address, await dao.ROOT_PERMISSION_ID());

  return psp;
}
