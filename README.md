# Notary

> Notary serves a simple purpose - store and verify documents.

## API

### `POST /store`
Calculates and stores on the blockchain hash of a provided file. <br>
Return the timestamp of a created record.


### `POST /verify`
Calculates the hash of a given file and check whether it exists on the blockchain. <br>
In case it does, returns the created timestamp, `null` otherwise.

## License
MIT.