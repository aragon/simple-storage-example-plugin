import { BigNumber } from "ethers";

export type VersionTag = { release: BigNumber; build: BigNumber };

export type PluginSetupRef = {
  versionTag: { release: BigNumber; build: BigNumber };
  pluginSetupRepo: string;
};

export type ReleaseMetadata = {
  metadata: string;
  builds: string[];
};

export type VersionMetadata = {
  releases: ReleaseMetadata[];
};
