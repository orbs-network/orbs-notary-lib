
const Orbs = require("orbs-client-sdk");
const fs = require("fs");
const { Notary, Audit } = require("./notary");

async function deploy(client, owner, code, contractName) {
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);
    return contractName;
}

function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

function getContractCodeAsBuffer() {
    return fs.readFileSync("./contract/notary/notary.go");
}

function getAuditContractCodeAsBuffer() {
    return fs.readFileSync("./contract/audit/audit.go");
}

async function setup() {
    const owner = Orbs.createAccount();
    await deploy(getClient(), owner, getContractCodeAsBuffer(), "Notary");
    await deploy(getClient(), owner, getAuditContractCodeAsBuffer(), "Audit"); 
    
    const notary = new Notary(getClient(), "Notary", owner.publicKey, owner.privateKey);
    const audit = new Audit(getClient(), "Audit", owner.publicKey, owner.privateKey);

    await notary.setAuditContractAddress("Audit");
    await audit.setEventSourceContractAddress("Notary");
}

(async () => {
    try {
        await setup();
        console.log("Success!")
    } catch(e) {
        console.log(e);
    }
})();
