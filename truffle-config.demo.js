const path = require("path");
const PrivateKeyProvider = require("truffle-privatekey-provider");
require("ts-node/register");
require('dotenv').config()

var privateKey = process.env.PRIVATE_KEY;
var ethereumEndpoint = process.env.ETHEREUM_ENDPOINT

module.exports = {
  contracts_build_directory: path.join(__dirname, "build"),
  networks: {
    mainnet: {
     provider: () => new PrivateKeyProvider(privateKey, ethereumEndpoint),
     network_id: process.env.NETWORK_ID
   }
  },
  mocha: {
  },
  compilers: {
    solc: {
    }
  }
};
