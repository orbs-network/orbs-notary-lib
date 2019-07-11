package main

import (
	"bytes"

	"github.com/orbs-network/contract-external-libraries-go/v1/structs"

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

var OWNER_KEY = []byte("owner")
var STATUS_LIST_KEY = []byte("status_key")

func _init() {
	state.WriteBytes(OWNER_KEY, address.GetSignerAddress())
}

func register(hash string, metadata string, secret string) (timestamp uint64, signer []byte) {
	if !bytes.Equal(state.ReadBytes([]byte(hash)), nil) {
		panic("Record already exists")
	}
	timestamp = env.GetBlockTimestamp()
	signer = address.GetSignerAddress()
	record := Record{
		Timestamp: timestamp,
		Signer:    signer,
		Metadata:  metadata,
		Secret:    secret,
	}
	structs.WriteStruct(hash, record)
	_recordAction(hash, "Register", "", "")
	return
}

func verify(hash string) (timestamp uint64, signer []byte, metadata string, secret string) {
	var res Record
	structs.ReadStruct(hash, &res)
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
