package main

import (
	"bytes"
	"strings"

	"github.com/orbs-network/contract-external-libraries-go/v1/structs"

	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/service"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(register, verify, setStatusList, getStatusList, updateStatus, setAuditContractAddress, getAuditContractAddress)
var SYSTEM = sdk.Export(_init)

type Record struct {
	Timestamp uint64
	Signer    []byte
	Metadata  string
	Secret    string
	Status    string
}

var OWNER_KEY = []byte("owner")
var STATUS_LIST_KEY = []byte("status_list_key")

func _init() {
	state.WriteBytes(OWNER_KEY, address.GetSignerAddress())
	state.WriteString(STATUS_LIST_KEY, "Registered,In Process,Approved,Rejected")
}

func register(hash string, metadata string, secret string) (timestamp uint64, signer []byte, status string) {
	_recordDoesNotExist(hash)
	timestamp = env.GetBlockTimestamp()
	signer = address.GetSignerAddress()
	status = _statusList()[0]

	record := Record{
		Timestamp: timestamp,
		Signer:    signer,
		Metadata:  metadata,
		Secret:    secret,
		Status:    status,
	}
	structs.WriteStruct(hash, record)
	_recordAction(hash, "Register", "", "")
	_recordAction(hash, "UpdateStatus", "", status)
	return
}

func verify(hash string) (timestamp uint64, signer []byte, metadata string, secret string, status string) {
	var res Record
	structs.ReadStruct(hash, &res)
	timestamp = res.Timestamp
	signer = res.Signer
	metadata = res.Metadata
	secret = res.Secret
	status = res.Status
	return
}

func setStatusList(statusList string) {
	_ownerOnly()
	state.WriteString(STATUS_LIST_KEY, statusList)
}

func getStatusList() string {
	return state.ReadString(STATUS_LIST_KEY)
}

func updateStatus(hash string, status string) {
	var res Record
	structs.ReadStruct(hash, &res)
	if res.Timestamp == 0 {
		panic("Record does not exist!")
	}

	for _, availableStatus := range _statusList() {
		if status == availableStatus {
			oldStatus := res.Status
			res.Status = status
			structs.WriteStruct(hash, res)
			_recordAction(hash, "StatusUpdate", oldStatus, status)

			return
		}
	}

	panic("can't change status to " + status + " because it's not on the list")
}

func _statusList() []string {
	return strings.Split(state.ReadString(STATUS_LIST_KEY), ",")
}

func _recordDoesNotExist(hash string) {
	var res Record
	structs.ReadStruct(hash, &res)
	if res.Timestamp != 0 {
		panic("Record already exists")
	}
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
