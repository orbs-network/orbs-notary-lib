const sjcl = require('sjcl');
const { argString, encodeHex } = require('orbs-client-sdk');

const sha256 = binary => {
  const hash = sjcl.hash.sha256.hash(binary);
  return sjcl.codec.hex.fromBits(hash);
};

// FIXME does not work
const readFileFromBrowser = (file) => {
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
  constructor(orbsClient, contractName, publicKey, privateKey) {
    this.orbsClient = orbsClient;
    this.contractName = contractName;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  async register(hash) {
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'register',
      [argString(hash)]
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
      signer
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
    return {
      hash,
      timestamp,
      signer,
      verified: timestamp > 0,
    };
  }
}

module.exports = {
  Notary,
  sha256,
}
