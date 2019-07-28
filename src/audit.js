const { argString } = require('orbs-client-sdk');

class Audit {
    constructor(orbsClient, contractName, publicKey, privateKey) {
        this.orbsClient = orbsClient;
        this.contractName = contractName;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    async setEventSourceContractAddress(addr) {
        const [tx, txId] = this.orbsClient.createTransaction(
            this.publicKey,
            this.privateKey,
            this.contractName,
            'setEventSourceContractAddress',
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
                signer: '0x' + e.SignerAddress
            };
        });
    }
}

module.exports = {
    Audit
}