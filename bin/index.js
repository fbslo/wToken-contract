#!/usr/bin/env node

require('dotenv').config();
const fs = require("fs")
const readline = require("readline");
var exec = require('child_process').exec;
const { toChecksumAddress } = require('ethereum-checksum-address')
const Web3 = require('web3');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const source = `pragma solidity ^0.5.1;\nimport "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";\nimport "./WrappedToken.sol";\n`

let os = process.platform

collectInformation()

async function collectInformation(){
  let token = {}
  let type = await getType()
  let name = await getName()
  let symbol = await getSymbol()
  let precision = await getPrecision()
  token["type"] = type
  token["name"] = name
  token["symbol"] = symbol
  token["precision"] = precision
  console.log(`\nYour choices: \nName: ${name}\nSymbol: ${symbol}\nPrecision: ${precision}\nType: ${type}\n`)
  let isCorrect = await confirmChoices()
  if (isCorrect == true) setup(token)
  if (isCorrect == false) collectInformation()
  if (isCorrect == 'unknown') console.log(`\nPlease use valid answer [Y/N]!\n`);
}

function getType(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter token type:\n[1] - Fixed supply\n[2] - Mintable\nYour choice: ', (answer) => {
      if (answer == 1) resolve('fixed')
      if (answer == 2) resolve('mintable')
    })
  });
}

function getName(){
  return new Promise((resolve, reject) => {
    rl.question('\nPlease enter token name: ', (answer) => {
      resolve(answer)
    })
  });
}

function getSymbol(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter token symbol: ', (answer) => {
      resolve(answer)
    })
  });
}

function getPrecision(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter token precison (number of decimals, 0-18): ', (answer) => {
      resolve(answer)
    })
  });
}

function confirmChoices(){
  return new Promise((resolve, reject) => {
    rl.question(`Is this correct [Y/N]? `, function(isOk) {
      if (isOk.toLowerCase() == "y") resolve(true)
      if (isOk.toLowerCase() == "n") resolve(false)
      else resolve('unknown')
    });
  });
}

function setup(token){
  if (token.type == 'mintable') mintable(token)
  if (token.type == 'fixed') fixed(token)
}

async function mintable(token){
  let sourceCode = await readFile("./source_code/mintable/Burnable.sol")
  let empty = await emptyFile("./contracts/Burnable.sol")
  let write = await writeFile("./contracts/Burnable.sol", sourceCode)
  let mainSource = source + `contract wToken is WrappedToken, ERC20Detailed("${token.name}", "${token.symbol}", ${token.precision}) {}`
  let writeMain = await writeFile("./contracts/wToken.sol", mainSource)
  //code is now complete, let's prepare for deployment
  let privateKey = await getPrivateKey()
  let ethereumEndpoint = await getEndpoint()
  let id = await getNetworkId(ethereumEndpoint)
  let data = `PRIVATE_KEY=${privateKey}\nETHEREUM_ENDPOINT=${ethereumEndpoint}\nTYPE=mintable\nNETWORK_ID=${id}\nPRECISION=${token.precision}`
  await writeFile("./.env", data)
  deploy(token, id)
}

async function fixed(token){
  let sourceCode = await readFile("./source_code/fixed/Burnable.sol")
  let empty = await emptyFile("./contracts/Burnable.sol")
  let address = await getDepositAddress()
  let amount = await getMaxTokens()
  let modifySource = sourceCode.split("=")[0] + `= ${toChecksumAddress(address)}` + sourceCode.split("=")[1]
  let write = await writeFile("./contracts/Burnable.sol", modifySource)
  let mainEmpty = await emptyFile("./contracts/wToken.sol")
  let capped = `\nimport "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";\n`
  let mainSource = source + capped + `contract wToken is WrappedToken, ERC20Capped(${amount * Math.pow(10, token.precision)}), ERC20Detailed("${token.name}", "${token.symbol}", ${token.precision}) {}`
  let writeMain = await writeFile("./contracts/wToken.sol", mainSource)
  //code is now complete, let's prepare for deployment
  let privateKey = await getPrivateKey()
  let ethereumEndpoint = await getEndpoint()
  let id = await getNetworkId(ethereumEndpoint)
  let data = `PRIVATE_KEY=${privateKey}\nETHEREUM_ENDPOINT=${ethereumEndpoint}\nADDRESS=${address}\nAMOUNT=${amount * Math.pow(10, token.precision)}\nTYPE=fixed\nNETWORK_ID=${id}\nPRECISION=${token.precision}`
  await writeFile("./.env", data)
  deploy(token, id, ethereumEndpoint, privateKey)
}

function deploy(token, id, ethereumEndpoint, privateKey){
  let copy_command = 'copy'
  if (os == "linux" || "darwin") copy_command = 'cp'
  console.log("Deploying contract, please wait...")
  if (id != 1){ //deploying on mainnet with truffle is throwing errors, but ropsten works????
    exec(copy_command+" truffle-config.demo.js truffle-config.js && truffle deploy --network mainnet", function(err, stdout, stderr) {
      if (err) console.log(err)
      console.log(stdout);
      generateABI()
      deleteEnv()
      console.log("Contract deployed, you can now exit.")
    });
  } else {
    deployWithEthers(token, ethereumEndpoint, privateKey)
  }
}

function deployWithEthers(token, ethereumEndpoint, privateKey){
  exec("truffle build && git clone https://github.com/INFURA/demo-eth-tx && mv build/wToken.json demo-eth-tx/Demo.json && cd demo-eth-tx && npm install", async function(err, stdout, stderr) {
    if (err) console.log(err)
    let config = await readFile("./demo-eth-tx/ethers/deploy.js")
    let configNew = config.replace("process.env.INFURA_PROJECT_ID", `'${ethereumEndpoint.split("/")[ethereumEndpoint.split("/").length -1]}'`)
        configNew = configNew.replace("rinkeby", "mainnet")
        configNew = configNew.replace("0xc5e8f61d1ab959b397eecc0a37a6517b8e67a0e7cf1f4bce5591f3ed80199122", "0x"+privateKey)
    let write = await writeFile("./demo-eth-tx/ethers/deploy.js", configNew)
    console.log(stdout);
    runDeployment()
  });
}

function runDeployment(){
  exec("cd demo-eth-tx && node ethers/deploy.js", async function(err, stdout, stderr) {
    if (err) console.log(err)
    console.log(stdout);
  });
}

function deleteEnv(){
  emptyFile("./.env")
}

async function generateABI(){
  let tokenABI = JSON.parse(await readFile("./build/wToken.json")).abi
  let data = `const ABI = ${JSON.stringify(tokenABI)}\n\nexports.ABI = ABI;`
  let createABI = writeFile("./tokenABI.js", data)
}

function getDepositAddress(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter Ethereum address to redirect converted tokens to: ', (answer) => {
      resolve(answer)
    })
  })
}

function getMaxTokens(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter how much tokens would you like to receive (total supply, sent to "redirect" address): ', (answer) => {
      resolve(answer)
    })
  })
}

function getPrivateKey(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter Ethereum private key: ', (answer) => {
      resolve(answer)
    })
  })
}

function getEndpoint(){
  return new Promise((resolve, reject) => {
    rl.question('Please enter Ethereum endpoint: ', (answer) => {
      resolve(answer)
    })
  })
}

async function getNetworkId(endpoint){ //truffle is now working even with "*", manually rewrite!
  return new Promise(async (resolve, reject) => {
    var web3 = new Web3(endpoint);
    let id = await web3.eth.net.getId()
    resolve(id)
  })
}

function readFile(location){
  return new Promise((resolve, reject) =>  {
    fs.readFile(location, (err, result) => {
      if (err) reject(err)
      else resolve(result.toString())
    })
  })
}

function writeFile(location, data){
  return new Promise((resolve, reject) =>  {
    fs.writeFile(location, data, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function emptyFile(location){
  return new Promise((resolve, reject) =>  {
    fs.writeFile(location, '', (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
