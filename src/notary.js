const sjcl = require('sjcl');
const { argString, encodeHex } = require('orbs-client-sdk/dist/index.es'); // for browser
// const { argString, encodeHex } = require('orbs-client-sdk'); // for node

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
  const hash = sjcl.hash.sha256.hash(binary);
  return sjcl.codec.hex.fromBits(hash);
};

function readFileFromBrowser(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      resolve(ev.target.result);
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
    const status = receipt.outputArguments[2].value;
    return {
      txHash,
      hash,
      timestamp: Number(timestamp),
      signer,
      metadata,
      secret,
      status
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
    const status = receipt.outputArguments[4].value;
    const verified = timestamp > 0;
    let metadata = receipt.outputArguments[2].value;

    if (verified && optionalOriginalFileContents) {
      try {
        const secondHash = sha256(optionalOriginalFileContents + secret);
        metadata = decryptWithPassword(secondHash, receipt.outputArguments[2].value);
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
      status
    };
  }

  async setAuditContractAddress(addr) {
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'setAuditContractAddress',
      [
        argString(addr)
      ],
    );
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(receipt.outputArguments[0].value);
    }

    return {
      txHash
    }
  }

  async setStatusList(statusList) {
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'setStatusList',
      [
        argString(statusList)
      ],
    );
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(receipt.outputArguments[0].value);
    }

    return {
      txHash
    }
  }

  async getStatusList() {
    const query = this.orbsClient.createQuery(
      this.publicKey,
      this.contractName,
      'getStatusList',
      []
    );
    const receipt = await this.orbsClient.sendQuery(query);
    const statusList = receipt.outputArguments[0].value;

    return statusList.split(',');
  }

  async updateStatus(hash, status) {
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'updateStatus',
      [
        argString(hash),
        argString(status)
      ],
    );
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(receipt.outputArguments[0].value);
    }

    return {
      txHash
    }
  }
}

class Audit {
  constructor(orbsClient, contractName, publicKey, privateKey) {
    this.orbsClient = orbsClient;
    this.contractName = contractName;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  async setEventSourceContractAddress(addr) {
    const [tx] = this.orbsClient.createTransaction(
      this.publicKey,
      this.privateKey,
      this.contractName,
      'setEventSourceContractAddress',
      [
        argString(addr)
      ],
    );
    const receipt = await this.orbsClient.sendTransaction(tx);
    const txHash = encodeHex(receipt.txHash);
    if (receipt.executionResult !== 'SUCCESS') {
      return Promise.reject(receipt.outputArguments[0].value);
    }

    return {
      txHash
    }
  }

  async getEventsByHash(hash) {
    const query = this.orbsClient.createQuery(
      this.publicKey,
      this.contractName,
      'getEventsByHash',
      [argString(hash)]
    );
    const receipt = await this.orbsClient.sendQuery(query);
    const results = JSON.parse(receipt.outputArguments[0].value) || [];
    return results.map(e => {
      return {
        action: e.Action,
        from: e.From,
        to: e.To,
        timestamp: e.Timestamp,
        signer: '0x'+ e.SignerAddress
      };
    });
  }
}

module.exports = {
  Notary,
  Audit,
  sha256,
  encryptWithPassword,
  decryptWithPassword,
  readFileFromBrowser
}
