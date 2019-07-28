
const Orbs = require("orbs-client-sdk");
const fs = require("fs");
const { Notary } = require("./notary");
const { Audit } = require("./audit");

async function deploy(client, owner, code, contractName) {
    const [tx, txid] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    return await client.sendTransaction(tx);
}

function getContractCodeAsBuffer() {
    return fs.readFileSync(`${__dirname}/../contract/notary/notary.go`);
}

function getAuditContractCodeAsBuffer() {
    return fs.readFileSync(`${__dirname}/../contract/audit/audit.go`);
}

async function setup(client, owner, { notaryContractName, auditContractName }) {
    await deploy(client, owner, getContractCodeAsBuffer(), notaryContractName);
    await deploy(client, owner, getAuditContractCodeAsBuffer(), auditContractName);

    const notary = new Notary(client, notaryContractName, owner.publicKey, owner.privateKey);
    const audit = new Audit(client, auditContractName, owner.publicKey, owner.privateKey);

    await notary.setAuditContractAddress(auditContractName);
    await audit.setEventSourceContractAddress(notaryContractName);
}

module.exports = {
    setup,
    getContractCodeAsBuffer,
    getAuditContractCodeAsBuffer
}