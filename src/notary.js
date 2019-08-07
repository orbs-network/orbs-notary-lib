const { argString, encodeHex } = require("orbs-client-sdk");
const { generateSecret, encryptWithPassword, decryptWithPassword, sha256 } = require("./crypto");

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
        let transformedMetadata = metadata;
        if (this.shouldEncrypt) {
            secret = generateSecret();
            const secondHash = sha256(payload + secret);
            transformedMetadata = encryptWithPassword(secondHash, metadata);
        }

        const [tx, txId] = this.orbsClient.createTransaction(
            this.publicKey,
            this.privateKey,
            this.contractName,
            'register',
            [
                argString(hash),
                argString(transformedMetadata),
                argString(secret),
            ],
        );
        const receipt = await this.orbsClient.sendTransaction(tx);
        if (receipt.executionResult !== 'SUCCESS') {
            return Promise.reject(receipt.outputArguments[0].value);
        }
        const timestamp = receipt.outputArguments[0].value;
        const signer = encodeHex(receipt.outputArguments[1].value);
        const status = receipt.outputArguments[2].value;
        return {
            txId,
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
        const [tx, txId] = this.orbsClient.createTransaction(
            this.publicKey,
            this.privateKey,
            this.contractName,
            'setAuditContractAddress',
            [
                argString(addr)
            ],
        );
        const receipt = await this.orbsClient.sendTransaction(tx);
        if (receipt.executionResult !== 'SUCCESS') {
            return Promise.reject(receipt.outputArguments[0].value);
        }

        return {
            txId
        }
    }

    async setStatusList(statusList) {
        const [tx, txId] = this.orbsClient.createTransaction(
            this.publicKey,
            this.privateKey,
            this.contractName,
            'setStatusList',
            [
                argString(statusList)
            ],
        );
        const receipt = await this.orbsClient.sendTransaction(tx);
        if (receipt.executionResult !== 'SUCCESS') {
            return Promise.reject(receipt.outputArguments[0].value);
        }

        return {
            txId
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
        const [tx, txId] = this.orbsClient.createTransaction(
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
        if (receipt.executionResult !== 'SUCCESS') {
            return Promise.reject(receipt.outputArguments[0].value);
        }

        return {
            txId
        }
    }
}


module.exports = {
    Notary,
    sha256,
    encryptWithPassword,
    decryptWithPassword
}
