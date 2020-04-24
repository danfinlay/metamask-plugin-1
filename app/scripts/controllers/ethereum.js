import { ethers } from 'ethers';
const harden = require('@agoric/harden')

const ethereum = {
  getProvider: async (networkName) => {
    const provider = ethers.getDefaultProvider(networkName);
    return harden({
      send: async (method, params) => {
        const response = await provider[method](...params)
        return harden(response)
      }
    });
  }
}

export default ethereum

