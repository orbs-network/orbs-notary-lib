package main

import (
	"time"

	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(register, verify)
var SYSTEM = sdk.Export(_init)

func _init() {}

func register(hash string) (timestamp uint64) {
	key := []byte(hash)
	if state.ReadUint64(key) != 0 {
		panic("Record already exists")
	}
	timestamp = uint64(time.Now().Unix())
	state.WriteUint64(key, timestamp)
	return
}

func verify(hash string) (timestamp uint64) {
	key := []byte(hash)
	return state.ReadUint64(key)
}
