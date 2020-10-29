const Migrations = artifacts.require("Migrations");

module.exports = function(deployer) {
  if (deployer.network === 'skipMigrations') {
    return;
  } else {
    deployer.deploy(Migrations);
  }
};
