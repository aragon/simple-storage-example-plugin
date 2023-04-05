import { BigNumber } from "ethers";

export type VersionTag = { release: BigNumber; build: BigNumber };

export type PluginSetupRef = {
  versionTag: { release: BigNumber; build: BigNumber };
  pluginSetupRepo: string;
};
