// const Migrations = artifacts.require("Migrations");
//
// module.exports = function(deployer) {
//   if (deployer.network === 'skipMigrations') {
//     return;
//   } else {
//     deployer.deploy(Migrations);
//   }
// };

const wToken = artifacts.require("wToken");

module.exports = function(deployer) {
  deployer.deploy(wToken)
    .then(() => {
      console.log(`Your token's smart contract address is: ${wToken.address}`)
    })
};
