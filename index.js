const { setup, getContractCodeAsBuffer, getAuditContractCodeAsBuffer } = require("./src/deploy");
const { Notary } = require("./src/notary");
const { Audit } = require("./src/audit");
const { encryptWithPassword, decryptWithPassword, sha256 } = require("./src/crypto");

module.exports = {
    // deploy
    setup,
    getContractCodeAsBuffer,
    getAuditContractCodeAsBuffer,

    // notary
    Notary,
    Audit,

    // crypto
    encryptWithPassword,
    decryptWithPassword,
    sha256
}