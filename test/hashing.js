const expect = require("expect.js");
const { sha256 } = require("../src/crypto");
const { randomBytes } = require("crypto");

function nodeSHA256(f) {
    return require("crypto").createHash('sha256').update(f, 'utf8').digest('hex')
}

describe("hashing", () => {
    it("produces the same result for strings", () => {
        expect(sha256("hello")).to.be.eql(nodeSHA256("hello"));
    });

    it("produces the same result for buffers", () => {
        const payload = randomBytes(100);
        expect(sha256(payload)).to.be.eql(nodeSHA256(payload));
    });
});