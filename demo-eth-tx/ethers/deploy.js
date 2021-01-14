const { ethers } = require('ethers');

// Loading the contract ABI and Bytecode
// (the results of a previous compilation step)
const fs = require('fs');
const { abi, bytecode } = JSON.parse(fs.readFileSync('Demo.json'));

async function main() {
  // Configuring the connection to an Ethereum node
  const network = 'ropsten';
  const provider = new ethers.providers.InfuraProvider(
    network,
    'df34aeb4a6ba4faf803ee8fddfc76aac'
  );
  // Creating a signing account from a private key
  const signer = new ethers.Wallet(
    '0x692db581194773f4e7e641b4f9b57eb817d0cc7e760516f935c35f36a9e74d87',
    provider
  );
  // Using the signing account to deploy the contract
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy({gasLimit: 3000000});
  console.log('Mining transaction...');
  console.log(
    `https://${network}.etherscan.io/tx/${contract.deployTransaction.hash}`
  );
  // Waiting for the transaction to be mined
  await contract.deployTransaction.wait();
  // The contract is now deployed on chain!
  console.log(`Contract deployed at ${contract.address}`);
}

require('dotenv').config();
main();
