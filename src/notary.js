const sjcl = require('sjcl');
const { argString, encodeHex } = require('orbs-client-sdk');

function encryptWithPassword(password, data) {
  return sjcl.encrypt(password, data);
}

function descryptWithPassword(password, data) {
  return sjcl.decrypt(password, data);
}

function sha256(binary) {
  const hash = sjcl.hash.sha256.hash(binary);
  return sjcl.codec.hex.fromBits(hash);
};

// FIXME does not work
function readFileFromBrowser(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const hex = binaryToHash(ev.target.result);
      resolve(hex);
    };
    reader.readAsBinaryString(file);
  });
};

class Notary {
  constructor(orbsClient, contractName, publicKey, privateKey, optionalPassword) {
    this.orbsClient = orbsClient;
    this.contractName = contractName;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.optionalPassword = optionalPassword;
  }

  encrypt(metadata) {
    return encryptWithPassword(this.optionalPassword, metadata);
  }

  decrypt(metadata) {
    return descryptWithPassword(this.optionalPassword, metadata);
  }

  async register(hash, metadata) {
    metadata = this.optionalPassword ? this.encrypt(metadata) : metadata;
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'register',
      [
        argString(hash),
        argString(metadata),
      ],
    );
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(receipt.outputArguments[0].value);
    }
    const timestamp = receipt.outputArguments[0].value;
    const signer = encodeHex(receipt.outputArguments[1].value);
    return {
      txHash,
      hash,
      timestamp: Number(timestamp),
      signer,
      metadata,
    };
  }

  async verify(hash) {
    const query = this.orbsClient.createQuery(
      this.publicKey,
      this.contractName,
      'verify',
      [argString(hash)]
    );
    const receipt = await this.orbsClient.sendQuery(query);
    const timestamp = Number(receipt.outputArguments[0].value);
    const signer = encodeHex(receipt.outputArguments[1].value);
    const verified = timestamp > 0;
    let metadata = "";

    if (verified) {
      try {
        metadata = this.optionalPassword ? this.decrypt(receipt.outputArguments[2].value) : receipt.outputArguments[2].value;
      } catch (e) {
        throw `Could not decode metadata: ${e.toString()}`;
      }
    }

    return {
      hash,
      timestamp,
      signer,
      metadata,
      verified,
    };
  }
}

module.exports = {
  Notary,
  sha256,
  encryptWithPassword,
  descryptWithPassword,
}
