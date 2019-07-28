const { Notary, Audit, sha256, encryptWithPassword, decryptWithPassword } = require("../index");
const Orbs = require("orbs-client-sdk");
const expect = require("expect.js");

async function deploy(client, owner, code, prefix) {
    const contractName = `${prefix}${new Date().getTime()}`;
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);

    console.log(result);

    return contractName;
}

function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

function getContractCodeAsBuffer() {
    return require("fs").readFileSync("./contract/notary/notary.go");
}

function getAuditContractCodeAsBuffer() {
    return require("fs").readFileSync("./contract/audit/audit.go");
}

describe("the library", () => {
    it("registers and verifies without encryption", async () => {
        const owner = Orbs.createAccount();
        const contractName = await deploy(getClient(), owner, getContractCodeAsBuffer());

        const notary = new Notary(getClient(), contractName, owner.publicKey, owner.privateKey);
        const registerResponse = await notary.register(getContractCodeAsBuffer(), "Insurance documents");
        console.log(registerResponse)
        expect(registerResponse.txId).not.to.be.empty();
        expect(registerResponse.status).to.be.eql("Registered");

        expect(registerResponse.metadata).to.be.eql("Insurance documents");
        expect(registerResponse.secret).to.be.empty();

        const verifyResponse = await notary.verify(registerResponse.hash);
        console.log(verifyResponse);
        expect(verifyResponse.verified).to.be.true;
        expect(verifyResponse.metadata).to.be.eql("Insurance documents");

        const verifyResponseForUnknownHash = await notary.verify("unknown-hash");
        console.log(verifyResponseForUnknownHash);
        expect(verifyResponseForUnknownHash.verified).to.be.false;
        expect(verifyResponse.metadata).to.be.empty;
    });

    it("registers and verifies without encryption but with audit", async () => {
        const owner = Orbs.createAccount();
        const contractName = await deploy(getClient(), owner, getContractCodeAsBuffer(), "Notary");
        const auditContractName = await deploy(getClient(), owner, getAuditContractCodeAsBuffer(), "Audit"); 

        const notary = new Notary(getClient(), contractName, owner.publicKey, owner.privateKey);
        const audit = new Audit(getClient(), auditContractName, owner.publicKey, owner.privateKey);

        await notary.setAuditContractAddress(auditContractName);
        await audit.setEventSourceContractAddress(contractName);

        const registerResponse = await notary.register(getContractCodeAsBuffer(), "Insurance documents");
        console.log(registerResponse)
        expect(registerResponse.txId).not.to.be.empty();
        expect(registerResponse.metadata).to.be.eql("Insurance documents");
        expect(registerResponse.secret).to.be.empty();
        expect(registerResponse.status).to.be.eql("Registered");

        const auditEventsResponse = await audit.getEventsByHash(registerResponse.hash);
        console.log(auditEventsResponse);
        expect(auditEventsResponse[0].action).to.be.eql("Register");
        expect(auditEventsResponse[1].action).to.be.eql("UpdateStatus");
        expect(auditEventsResponse[1].to).to.be.eql("Registered");

        const verifyResponse = await notary.verify(registerResponse.hash);
        console.log(verifyResponse);
        expect(verifyResponse.verified).to.be.true;
        expect(verifyResponse.metadata).to.be.eql("Insurance documents");
    });

    it("registers and verifies with encryption", async () => {
        const owner = Orbs.createAccount();
        const contractName = await deploy(getClient(), owner, getContractCodeAsBuffer(), "Notary");

        const notary = new Notary(getClient(), contractName, owner.publicKey, owner.privateKey, true);
        const registerResponse = await notary.register(getContractCodeAsBuffer(), "Insurance documents");
        console.log(registerResponse)
        expect(registerResponse.txId).not.to.be.empty();

        expect(registerResponse.metadata).not.to.be.eql("Insurance documents");
        expect(registerResponse.secret).not.to.be.empty();

        const verifyResponse = await notary.verify(registerResponse.hash, getContractCodeAsBuffer());
        console.log(verifyResponse);
        expect(verifyResponse.verified).to.be.true;
        expect(verifyResponse.metadata).to.be.eql("Insurance documents");

        const verifyResponseWithoutOriginalFile = await notary.verify(registerResponse.hash);
        console.log(verifyResponseWithoutOriginalFile);
        expect(verifyResponseWithoutOriginalFile.verified).to.be.true;
        expect(verifyResponseWithoutOriginalFile.metadata).not.to.be.eql("Insurance documents");

        const verifyResponseForUnknownHash = await notary.verify("unknown-hash");
        console.log(verifyResponseForUnknownHash);
        expect(verifyResponseForUnknownHash.verified).to.be.false;
        expect(verifyResponse.metadata).to.be.empty;
    });

    it("can encrypt and decrypt metadata", () => {
        const p = "password";
        expect(decryptWithPassword(p, encryptWithPassword(p, "hello"))).to.be.eql("hello");
    })

    it("can calculate hash", () => {
        const hash = sha256(Buffer.from("hello", "ascii"));
        expect(hash).to.be.eql("448dd2d08744ccbdb3aee98ebae3978c57c7d0e58a9f8bbc9cbc918ace49a05b");
    });
});

