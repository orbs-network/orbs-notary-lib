package main

import (
	"bytes"
	"encoding/json"

	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(register, verify)
var SYSTEM = sdk.Export(_init)

type Record struct {
	Timestamp uint64
	Signer    []byte
	Metadata  string
	Secret    string
	Status    string
}

func _init() {}

func register(hash string, metadata string, secret string) (timestamp uint64, signer []byte) {
	key := []byte(hash)
	if !bytes.Equal(state.ReadBytes(key), nil) {
		panic("Record already exists")
	}
	timestamp = env.GetBlockTimestamp()
	signer = address.GetSignerAddress()
	encoded, _ := json.Marshal(&Record{
		Timestamp: timestamp,
		Signer:    signer,
		Metadata:  metadata,
		Secret:    secret,
	})
	state.WriteBytes(key, encoded)
	return
}

func verify(hash string) (timestamp uint64, signer []byte, metadata string, secret string) {
	key := []byte(hash)
	var res Record
	json.Unmarshal(state.ReadBytes(key), &res)
	timestamp = res.Timestamp
	signer = res.Signer
	metadata = res.Metadata
	secret = res.Secret
	return
}
