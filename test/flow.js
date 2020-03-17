const { Notary, Audit, sha256, encryptWithPassword, decryptWithPassword, setup } = require("../index");
const Orbs = require("orbs-client-sdk");
const expect = require("expect.js");

function getTestFileAsBuffer() {
    return require("fs").readFileSync(`${__dirname}/../package.json`);
}

function nodeSHA256(f) {
    return require("crypto").createHash('sha256').update(f, 'utf8').digest('hex')
}

function getClient() {
    const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
    const chain = Number(process.env.ORBS_VCHAIN) || 42;
    return new Orbs.Client(endpoint, chain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

describe("the library", () => {
    it("registers and verifies without encryption", async () => {
        const owner = Orbs.createAccount();
        const notaryContractName = `Notary${new Date().getTime()}`;

        await setup(getClient(), owner, {
            notaryContractName,
        });

        const notary = new Notary(getClient(), notaryContractName, owner.publicKey, owner.privateKey);
        const registerResponse = await notary.register(getTestFileAsBuffer(), "Insurance documents");
        console.log(registerResponse)
        expect(registerResponse.txId).not.to.be.empty();
        expect(registerResponse.status).to.be.eql("Registered");
        expect(registerResponse.hash).to.be.eql(nodeSHA256(getTestFileAsBuffer()));

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
        const notaryContractName = `Notary${new Date().getTime()}`;
        const auditContractName = `Audit${new Date().getTime()}`;

        await setup(getClient(), owner, {
            notaryContractName,
            auditContractName
        });

        const notary = new Notary(getClient(), notaryContractName, owner.publicKey, owner.privateKey);
        const audit = new Audit(getClient(), auditContractName, owner.publicKey, owner.privateKey);

        await notary.setAuditContractAddress(auditContractName);
        await audit.setEventSourceContractAddress(notaryContractName);

        const registerResponse = await notary.register(getTestFileAsBuffer(), "Insurance documents");
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
        const notaryContractName = `Notary${new Date().getTime()}`;
        const auditContractName = `Audit${new Date().getTime()}`;

        await setup(getClient(), owner, {
            notaryContractName,
            auditContractName
        });

        const notary = new Notary(getClient(), notaryContractName, owner.publicKey, owner.privateKey, true);
        const registerResponse = await notary.register(getTestFileAsBuffer(), "Insurance documents");
        console.log(registerResponse)
        expect(registerResponse.txId).not.to.be.empty();

        expect(registerResponse.metadata).to.be.eql("Insurance documents");
        expect(registerResponse.secret).not.to.be.empty();

        const verifyResponse = await notary.verify(registerResponse.hash, getTestFileAsBuffer());
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
});

