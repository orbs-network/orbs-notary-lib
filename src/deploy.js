
const Orbs = require("orbs-client-sdk");
const fs = require("fs");
const { Notary } = require("./notary");
const { Audit } = require("./audit");

async function deploy(client, owner, code, contractName) {
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);
    return contractName;
}

function getClient() {
    const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
    const chain = Number(process.env.ORBS_VCHAIN) || 42;
    return new Orbs.Client(endpoint, chain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

function getContractCodeAsBuffer() {
    return fs.readFileSync(`${__dirname}/../contract/notary/notary.go`);
}

function getAuditContractCodeAsBuffer() {
    return fs.readFileSync(`${__dirname}/../contract/audit/audit.go`);
}

async function setup(options) {
    const opt = options || {};
    const notaryName = opt.notary || "Notary";
    const auditName = opt.audit || "Audit";

    const owner = Orbs.createAccount();
    await deploy(getClient(), owner, getContractCodeAsBuffer(), notaryName);
    await deploy(getClient(), owner, getAuditContractCodeAsBuffer(), auditName); 
    
    const notary = new Notary(getClient(), "Notary", owner.publicKey, owner.privateKey);
    const audit = new Audit(getClient(), "Audit", owner.publicKey, owner.privateKey);

    await notary.setAuditContractAddress("Audit");
    await audit.setEventSourceContractAddress("Notary");
}

module.exports = {
    setup,
    getContractCodeAsBuffer,
    getAuditContractCodeAsBuffer
}