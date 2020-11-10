const wToken = artifacts.require("wToken");
const fs = require("fs")
require('dotenv').config();

module.exports = function(deployer) {
  deployer.deploy(wToken)
    .then(async () => {
      try {
        console.log(`Your token's smart contract address is: ${wToken.address}`)
        let empty = await writeFile("./state.json", "")
        await writeFile("./state.json", `{"contract": "${wToken.address}"}`)
        if (process.env.TYPE == 'fixed'){ //mint tokens
          let instance = await wToken.deployed()
          console.log(`Contract deployed, minting ${process.env.AMOUNT / Math.pow(10, process.env.PRECISION)} tokens...`)
          let tx = await instance.mint(process.env.ADDRESS, process.env.AMOUNT)
          console.log(`${process.env.AMOUNT / Math.pow(10, process.env.PRECISION)} tokens minted to ${process.env.ADDRESS}!`)
          //let minter = tx.receipt.from
          //await instance.removeMinter(minter)
        }
      } catch (e) {
        console.log(e)
      }
    })
};

function writeFile(location, data){
  return new Promise((resolve, reject) =>  {
    fs.writeFile(location, data, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
