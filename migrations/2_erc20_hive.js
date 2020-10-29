const wToken = artifacts.require("wToken");

module.exports = function(deployer) {
  deployer.deploy(wToken);
};
