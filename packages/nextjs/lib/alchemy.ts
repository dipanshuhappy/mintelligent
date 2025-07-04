import { Network, Alchemy } from "alchemy-sdk";
import { env } from "~~/env";
// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: env.NEXT_PUBLIC_ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.ETH_SEPOLIA, // Replace with your network.
};
export const alchemy = new Alchemy(settings);