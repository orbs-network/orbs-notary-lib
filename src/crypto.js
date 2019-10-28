const sjcl = require('sjcl');

function generateSecret() {
    return sjcl.codec.hex.fromBits(sjcl.random.randomWords(4));
}

function encryptWithPassword(password, data) {
    return sjcl.encrypt(password, data);
}

function decryptWithPassword(password, data) {
    return sjcl.decrypt(password, data);
}

function sha256(binary) {
    // Compatibility layer for nodejs buffer
    if (binary.__proto__.constructor.name === "Buffer") {
        binary = sjcl.codec.base64.toBits(binary.toString("base64"))
    }

    const hash = sjcl.hash.sha256.hash(binary);
    return sjcl.codec.hex.fromBits(hash);
};

module.exports = {
    encryptWithPassword,
    decryptWithPassword,
    sha256,
    generateSecret
}