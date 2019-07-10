const sjcl = require('sjcl');
// const { argString, encodeHex } = require('orbs-client-sdk/dist/index.es'); // for browser
const { argString, encodeHex } = require('orbs-client-sdk'); // for node

function generateSecret() {
  return sjcl.codec.hex.fromBits(sjcl.random.randomWords(4));
}

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

function readFileFromBrowser(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const hex = sha256(ev.target.result);
      resolve(hex);
    };
    reader.readAsBinaryString(file);
  });
};

class Notary {
  constructor(orbsClient, contractName, publicKey, privateKey, shouldEncrypt) {
    this.orbsClient = orbsClient;
    this.contractName = contractName;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.shouldEncrypt = shouldEncrypt;
  }

  async register(payload, metadata) {
    let secret = "";
    let hash = sha256(payload);
    if (this.shouldEncrypt) {
      secret = generateSecret();
      const secondHash = sha256(payload + secret);
      metadata = encryptWithPassword(secondHash, metadata);
    }

    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'register',
      [
        argString(hash),
        argString(metadata),
        argString(secret),
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
      secret
    };
  }

  async verify(hash, optionalOriginalFileContents) {
    const query = this.orbsClient.createQuery(
      this.publicKey,
      this.contractName,
      'verify',
      [argString(hash)]
    );
    const receipt = await this.orbsClient.sendQuery(query);
    const timestamp = Number(receipt.outputArguments[0].value);
    const signer = encodeHex(receipt.outputArguments[1].value);
    const secret = receipt.outputArguments[3].value;
    const verified = timestamp > 0;
    let metadata = receipt.outputArguments[2].value;

    if (verified && optionalOriginalFileContents) {
      try {
        const secondHash = sha256(optionalOriginalFileContents + secret);
        metadata = descryptWithPassword(secondHash, receipt.outputArguments[2].value);
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
      secret,
    };
  }
}

module.exports = {
  Notary,
  sha256,
  encryptWithPassword,
  descryptWithPassword,
  readFileFromBrowser
}
