import sjcl from 'sjcl';
import {
  argString,
  encodeHex
} from 'orbs-client-sdk/dist/index.es';

const binaryToHash = (binary) => {
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
  _buildTransactions(methodName, hash) {
    return this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      'notary',
      methodName,
      [argString(hash)]
    );
  }
  async register(file) {
    const hash = await this._readFile(file);
    const [tx] = this._buildTransactions('register', hash);
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    const returnValue = receipt.outputArguments[0].value;
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(returnValue);
    }
    return {
      txHash,
      hash,
      timestamp: Number(returnValue)
    }
  }

  async verify(file) {
    const hash = await this._readFile(file);
    const [tx] = this._buildTransactions('verify', hash);
    const receipt = await this.orbsClient.sendTransaction(tx);
    const timestamp = receipt.outputArguments[0].value;
    return {
      hash,
      timestamp: Number(timestamp)
    }
  }
}

export default Actions;
