const { Notary, sha256 } = require("../src/notary");
const Orbs = require("orbs-client-sdk");
const expect = require("expect.js");

async function deploy(client, owner, code) {
    const contractName = `T${new Date().getTime()}`;
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);

    console.log(result);

    return contractName;
}

function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

function getContractCodeAsBuffer() {
    return require("fs").readFileSync("./contract/notary.go");
}

describe("the library", () => {
    it("can register and verify", async () => {
        const owner = Orbs.createAccount();
        const contractName = await deploy(getClient(), owner, getContractCodeAsBuffer());

        const actions = new Notary(getClient(), contractName, owner.publicKey, owner.privateKey);
        const registerResponse = await actions.register("somehash");
        console.log(registerResponse)
        expect(registerResponse.txHash).not.to.be.empty;

        const verifyResponse = await actions.verify("somehash");
        console.log(verifyResponse);
        expect(verifyResponse.verified).to.be.true;

        const verifyResponseForUnknownHash = await actions.verify("unknown-hash");
        console.log(verifyResponseForUnknownHash);
        expect(verifyResponseForUnknownHash.verified).to.be.false;
    });

    it("can calculate hash", () => {
        const hash = sha256(Buffer.from("hello", "ascii"));
        expect(hash).to.be.eql("448dd2d08744ccbdb3aee98ebae3978c57c7d0e58a9f8bbc9cbc918ace49a05b");
    });
});

