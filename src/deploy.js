
const Orbs = require("orbs-client-sdk");
const fs = require("fs");
const { Notary } = require("./notary");
const { Audit } = require("./audit");
const NotaryContractName = process.env.NOTARY_CONTRACT_NAME || "Notary";
const AuditContractName = process.env.AUDIT_CONTRACT_NAME || "Audit";

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

function getClient() {
    const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
    const chain = Number(process.env.ORBS_VCHAIN) || 42;
    return new Orbs.Client(endpoint, chain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

function getOwner() {
    const publicKey = process.env.ORBS_PUBLIC_KEY;
    const privateKey = process.env.ORBS_PRIVATE_KEY;

    if (publicKey || privateKey) {
        return {
            publicKey: Orbs.decodeHex(publicKey),
            privateKey: Orbs.decodeHex(privateKey),
        }
    }

    return Orbs.createAccount();
}

async function setup(client, owner, { notaryContractName, auditContractName }) {
    await deploy(client, owner, getContractCodeAsBuffer(), notaryContractName);
    const notary = new Notary(client, notaryContractName, owner.publicKey, owner.privateKey);

    if (auditContractName) {
        await deploy(client, owner, getAuditContractCodeAsBuffer(), auditContractName);

        const audit = new Audit(client, auditContractName, owner.publicKey, owner.privateKey);

        await notary.setAuditContractAddress(auditContractName);
        await audit.setEventSourceContractAddress(notaryContractName);
    }
}

module.exports = {
    setup,
    getContractCodeAsBuffer,
    getAuditContractCodeAsBuffer,
    NotaryContractName,
    AuditContractName
}

if (!module.parent) {
    (async () => {
        try {
            // await deploy(getClient(), getOwner(), getContractCodeAsBuffer(), NotaryContractName);

            await setup(getClient(), getOwner(), {
                notaryContractName: NotaryContractName,
                auditContractName: AuditContractName
            });
            console.log("Success!")
        } catch(e) {
            console.log(e);
        }
    })();
}