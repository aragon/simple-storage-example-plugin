import IPFS from "ipfs-http-client";

export async function uploadToIPFS(
  metadata: string,
  // networkName: string
): Promise<string> {
  const client = IPFS.create({
    url: "https://ipfs-0.aragon.network/api/v0",
    headers: {
      "X-API-KEY": "yRERPRwFAb5ZiV94XvJdgvDKoGEeFerfFsAQ65",
    },
  });

  /*if (networkName === 'hardhat' || networkName === 'localhost') {
    // return a dummy path
    return 'QmNnobxuyCjtYgsStCPhXKEiQR5cjsc3GtG9ZMTKFTTEFJ';
  }*/

  const cid = await client.add(metadata);
  await client.pin.add(cid.cid);
  return cid.path;
}
