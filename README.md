# Notary

> Notary serves a simple purpose - store and verify documents.

## Getting started
### Running client only
1. Choose client directory: `cd client`
1. Install dependencies: `npm install` (skip if done before)
1. Start local dev server: `npm run start:dev`
1. Go to `http://localhost:5000`

### Running Server only
1. Install dependencies from the root of the project: `npm install` (skip if done before)
1. Start the server: `npm run dev`
1. Go to `http://localhost:5678`

### Running Server with statics
1. Go to client folder: `cd client`
1. Build the static bundle: `npm run build`
1. Return to the project root: `cd ..`
1. Start main server: `npm run dev`
1. Go to `http://localhost:5678`

## Server API

### `POST /store`
Calculates and stores on the blockchain hash of a provided file. <br>
Return the timestamp of a created record.


### `POST /verify`
Calculates the hash of a given file and check whether it exists on the blockchain. <br>
In case it does, returns the created timestamp, `null` otherwise.

## Deployment
`npm run deploy`

## License
MIT.