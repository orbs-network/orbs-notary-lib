# Orbs Notary library

> Notary serves a simple purpose - store and verify documents.

## High level flow
The library consists of two smart contracts and two javascript interfaces that communicate with these contracts.

A reference implementation of the different flows documented can be found at the E2E tests here: https://github.com/orbs-network/orbs-notary-lib/blob/master/test/flow.js

### The Notary contract
This is the main contract of the library, the goal of this contract is to register document hashes paired with metadata (encrypted or plain text and a status field) and track the authenticity of the registered hash and its status.

### The Audit contract
This is an auxiliary contract that allows the customer to track any changes to the status field. For example moving a request from `registered` to `approved` or `rejected`

## Notary Library Reference

### Importing the library

```js
import { setup, Notary, Audit, sha256 } from "orbs-notary-lib"
```

or

```js
const { setup, Notary, Audit, sha256 } = require("orbs-notary-lib")
```

### Deploying smart contracts

```javascript
function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

const owner = Orbs.createAccount();

const notaryContractName = "Notary";
const auditContractName = "Audit";

await setup(getClient(), owner, {
    notaryContractName,
    auditContractName
})
```

`setup` function will deploy two new contracts and bind them to work together. This only needs to be done once. Save the contract names for later use.

Each contract (`Notary` and `Audit`) has their specific role but they need to be made aware of each other: `Notary` needs to send event data to `Audit` and because of that needs to know its name. `Audit` needs to accept the data from `Notary` and because of that needs to know its name.

`setup` function takes as parameters:
- Orbs client (client-sdk)
- Orbs account (client-sdk)
- An object containing names of the contracts to deploy (does not matter how you name them, but they should be different)

`setup` function does not return anything.

### Initializing a Notary instance
```javascript
function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

const owner = Orbs.createAccount();
const notaryContractName = "Notary";

const notary = new Notary(getClient(), notaryContractName, owner.publicKey, owner.privateKey, false);
```

The `new Notary()` takes as parameters:
- Orbs client (client-sdk)
- A contract name as a string
- A public key of an orbs account as a byte array
- A private key of an orbs account as a byte array
- A boolean flag to enable or disable automatic encryption

This Orbs account (the key pair provided) signs the requests made to the Orbs blockchain.
Because of the nature of this library, that account is not important per se as the notarization is not about who is requesting to sign a document, but rather that a document is signed at a specific time.

More information on encryption is available in a dedicated section below.

### Register a document
```javascript
const document = require("fs").readFileSync("/path/to/file.pdf");
const registerResponse = await notary.register(document, "Insurance documents");
```

The `notary.register()` takes as parameters:
- A byte array of the file to sign
- A descriptive name for that file

The response object will contain the following fields:
- `txId`: The transaction id of the register transaction on the Orbs blockchain
- `hash`: The document hash (the document that was registered)
- `timestamp`: The unix timestamp in nanoseconds of the block of the registered transaction
- `signer`: The hex encoded address of the orbs account which signed the transaction
- `metadata`: The descriptive name of the document - this could be encrypted, depending on how the library was instantiated
- `secret`: Shared secret used for encryption - this could be empty if no encryption is used
- `status`: Upon registration, on every new document by default this will be set to "Registered"

### Verify a document
```javascript
const document = require("fs").readFileSync("/path/to/file.pdf");
const documentHash = sha256(document);
const verifyResponse = await notary.verify(documentHash, document);
```

The `notary.verify()` takes as parameters:
- A hash of the document as a string
- A byte array of the original document; optional. Required to decrypt metadata in case it was encrypted. More information on encryption is available in a dedicated section below.

The response object will contain the following fields:
- `hash`: The document hash
- `timestamp`: The unix timestamp in nanoseconds of the block of the registered transaction
- `signer`: The hex encoded address of the orbs account which signed the transaction
- `metadata`: The descriptive name of the document - this could be encrypted, depending on how the library was instantiated and if the original document was provided
- `secret`: Shared secret used for encryption - this could be empty if no encryption is used
- `status`: Upon registration, on every new document by default this will be set to "Registered"
- `verified`: This will be true if the verify was successful, false if not

### Controlling the status states

Every document is assigned a status when it is registered. The list of available statuses is also stored on the chain and can be changed. First item on the list becomes the deafult status.

If the list of available statuses is updated after a document was already registered, its status will stay the same.

#### Getting the available status list
```javascript
await notary.getStatusList()
```

The `notary.getStatusList()` does not take any parameters.

It returns an array of the available statuses, by default, the following will be returned:
```
["Registered","In Process","Approved","Rejected"]
```

#### Setting a new status list
```javascript
await notary.setStatusList(statusList)
```

The purpose of this api is to change the status text

The `notary.setStatusList()` takes:
- A list of comma separated values

It returns the txId of the transaction which changed the status list text

After the status list text changes, the first status text will be assigned automatically to event new document registered.

#### Updating the status on a document
```javascript
await notary.updateStatus(hash, status)
```

The `notary.updateStatus()` takes:
- The hash of the document to update
- The status text to update to. This text must be part of the allowed status list

It returns the txId of the transaction which updated the status of the document

Currently, anyone who can send a transaction on the network will be able to update the status for any document, as long as the hash of the document is available.

### Registering the Audit contract with the Notary

This step is performed automatically with `setup` call. Please refer to the section "Deploying smart contracts" for the explanation.

```javascript
const auditContractName = "Audit";
await notary.setAuditContractAddress(auditContractName);
```

The `notary.setAuditContractAddress()` takes:
- The contract name of the deployed Audit contract as a string

It returns the txId of the transaction which linked the contracts

## Encryption flow
When the notary library is instantiated, it is possible to request that it uses encryption.

The data that will be encrypted is the metadata set on the document being notarized.

When encryption is **off**, the secret field remains empty, and the metadata will be stored in plain text.

When encryption is **on**:
- The secret field is generated upon registration, and is stored on-chain. Its data is a random set of bytes
- The document is hashed (regardless of the encryption flow)
- The document and secret are appended, and a new hash is created of the combined data
- That combined data hash (document+secret) is then used to encrypt the metadata (AES encryption)

At that point, the encrypted metadata is stored on chain.

The decrypt flow is executed automatically as part of the `verify` function call if an optional argument of the original document content is passed.

During decrypt:
- The secret is pulled according to the document hash
- It is appended to the original document content and that new data is then hashed (in the same exact way it was done during encryption)
- The encrypted metadata is then decrypted using the constructed key

If the original document content is not passed during verify, the encrypted metadata will still be returned, encrypted and unreadable.

## Audit Library reference
The Audit feature gives us the ability to see the audit trail of the actions performed on the notary contract. The events can be the Register event (one per document) or an UpdateStatus event (multiple per document).

In order to make this feature work, both contracts need to be aware of each other, the Notary needs to register the Audit and the Audit needs to register the Notary contract, as explained in the reference.


### Initializing an Audit instance
```javascript
function getClient() {
    return new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
}

const owner = Orbs.createAccount();
const auditContractName = "Audit";

const audit = new Audit(getClient(), auditContractName, owner.publicKey, owner.privateKey);
```

The `new Audit()` takes as parameters:
- Orbs client (client-sdk)
- A contract name as a string
- A public key of an orbs account as a byte array
- A private key of an orbs account as a byte array

### Registering the Notary contract with the Audit

This step is performed automatically with `setup` call. Please refer to the section "Deploying smart contracts" for the explanation.

```javascript
const notaryContractName = "Notary";
await audit.setEventSourceContractAddress(notaryContratName);
```

The `audit.setEventSourceContractAddress()` takes:
- The contract name of the deployed Notary contract as a string

It returns the txId of the transaction which linked the contracts

### Getting the audit trail of changes to a document
```javascript
await audit.getEventsByHash(hash)
```

The `audit.getEventsByHash` takes:
- The hash of the document we want the events trail on

It returns an array of objects containing the following fields:
- `action`: Can be either "Register" or "UpdateStatus"
- `from`: The previous value of the related field, only valid for UpdateStatus
- `to`: The new value of the status
- `timestamp`: The unix timestamp in nanoseconds when the update happened
- `signer`: The address used to sign the transaction that made the change

## Testing this library

Running tests requires [gamma-cli](https://github.com/orbs-network/gamma-cli) - Orbs local blockchain.

`npm test`

## License
MIT.
