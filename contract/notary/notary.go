package main

import (
	"bytes"
	"encoding/json"

	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/service"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(register, verify, setAuditContractAddress, getAuditContractAddress)
var SYSTEM = sdk.Export(_init)

type Record struct {
	Timestamp uint64
	Signer    []byte
	Metadata  string
	Secret    string
	Status    string
}

var OWNER_KEY = []byte("OWNER")

func _init() {
	state.WriteBytes(OWNER_KEY, address.GetSignerAddress())
}

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
	_recordAction(hash, "Register", "", "")
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

func _ownerOnly() {
	if !bytes.Equal(state.ReadBytes(OWNER_KEY), address.GetSignerAddress()) {
		panic("not allowed!")
	}
}

// Audit

var AUDIT_CONTRACT_ADDRESS = []byte("audit_contract_address")

func setAuditContractAddress(addr string) {
	_ownerOnly()
	state.WriteString(AUDIT_CONTRACT_ADDRESS, addr)
}

func getAuditContractAddress() string {
	return state.ReadString(AUDIT_CONTRACT_ADDRESS)
}

func _recordAction(hash string, action string, from string, to string) {
	if auditContractAddress := getAuditContractAddress(); auditContractAddress != "" {
		service.CallMethod(auditContractAddress,
			"recordEvent",
			hash,
			action,
			from,
			to,
		)
	}
}
