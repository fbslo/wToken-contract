const path = require("path");
const PrivateKeyProvider = require("truffle-privatekey-provider");
require("ts-node/register");
var Web3 = require('web3');
require('dotenv').config()

var privateKey = process.env.PRIVATE_KEY;
var ethereumEndpoint = process.env.ETHEREUM_ENDPOINT
var web3 = new Web3(process.env.ETHEREUM_ENDPOINT);

var id = web3.eth.net.getId() || 1

module.exports = {
  contracts_build_directory: path.join(__dirname, "build"),
  networks: {
    mainnet: {
     provider: () => new PrivateKeyProvider(privateKey, ethereumEndpoint),
     network_id: id
   }
  },
  mocha: {
  },
  compilers: {
    solc: {
    }
  }
};
