const { setup, getContractCodeAsBuffer, getAuditContractCodeAsBuffer } = require("./src/deploy");
const { Notary, Audit, encryptWithPassword, decryptWithPassword, sha256 } = require("./src/notary");

module.exports = {
    // deploy
    setup,
    getContractCodeAsBuffer,
    getAuditContractCodeAsBuffer,

    // notary
    Notary,
    Audit,
    encryptWithPassword,
    decryptWithPassword,
    sha256
}