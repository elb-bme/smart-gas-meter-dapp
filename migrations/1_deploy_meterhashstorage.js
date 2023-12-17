const MeterHashStorage = artifacts.require("MeterHashStorage");

module.exports = function (deployer) {
    deployer.deploy(MeterHashStorage);
};