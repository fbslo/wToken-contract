#!/usr/bin/env node

require('dotenv').config();
const fs = require("fs")
const readline = require("readline");
var exec = require('child_process').exec;
const { toChecksumAddress } = require('ethereum-checksum-address')

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
    rl.question('Please enter token precison (number of decimals): ', (answer) => {
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
  let data = `PRIVATE_KEY=${privateKey}\nETHEREUM_ENDPOINT=${ethereumEndpoint}\nTYPE=mintable`
  await writeFile("./.env", data)
  deploy(token)
}

async function fixed(token){
  let sourceCode = await readFile("./source_code/fixed/Burnable.sol")
  let empty = await emptyFile("./contracts/Burnable.sol")
  let address = await getDepositAddress()
  let modifySource = sourceCode.split("=")[0] + `= ${toChecksumAddress(address)}` + sourceCode.split("=")[1]
  let write = await writeFile("./contracts/Burnable.sol", modifySource)
  let mainEmpty = await emptyFile("./contracts/wToken.sol")
  let mainSource = source + `contract wToken is WrappedToken, ERC20Detailed("${token.name}", "${token.symbol}", ${token.precision}) {}`
  let writeMain = await writeFile("./contracts/wToken.sol", mainSource)
  let amount = await getMaxTokens()
  //code is now complete, let's prepare for deployment
  let privateKey = await getPrivateKey()
  let ethereumEndpoint = await getEndpoint()
  let data = `PRIVATE_KEY=${privateKey}\nETHEREUM_ENDPOINT=${ethereumEndpoint}\nADDRESS=${address}\nAMOUNT=${amount * Math.pow(10, token.precision)}`
  await writeFile("./.env", data)
  deploy(token)
}

function deploy(token){
  let copy_command = 'copy'
  if (os == "linux") copy_command = 'cp'
  exec(copy_command+" truffle-config.demo.js truffle-config.js && truffle deploy --network mainnet", function(err, stdout, stderr) {
    if (err) console.log(err)
    console.log(stdout);
    generateABI()
  });
}

async function generateABI(){
  let tokenABI = JSON.parse(await readFile("./build/wToken.json")).abi
  let data = `const ABI = ${JSON.stringify(tokenABI)}\n\nexports.ABI = ABI;`
  let createABI = writeFile("./tokenABI.js", data)
}

generateABI()

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
