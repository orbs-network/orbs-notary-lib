import sjcl from 'sjcl';
import { argString, encodeHex } from 'orbs-client-sdk/dist/index.es';

const binaryToHash = binary => {
  const hash = sjcl.hash.sha256.hash(binary);
  return sjcl.codec.hex.fromBits(hash);
};

class Actions {
  constructor(orbsClient, publicKey, privateKey) {
    this.orbsClient = orbsClient;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }
  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const hex = binaryToHash(ev.target.result);
        resolve(hex);
      };
      reader.readAsBinaryString(file);
    });
  }

  async register(file) {
    const hash = await this._readFile(file);
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      'notary',
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

  async verify(file) {
    const hash = await this._readFile(file);
    const query = this.orbsClient.createQuery(
      this.publicKey,
      'notary',
      'verify',
      [argString(hash)]
    );
    const receipt = await this.orbsClient.sendQuery(query);
    const timestamp = receipt.outputArguments[0].value;
    const signer = encodeHex(receipt.outputArguments[1].value);
    return {
      hash,
      timestamp: Number(timestamp),
      signer
    };
  }
}

export default Actions;
