// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

/**
 * @title MeterHashStorage
 * @dev Manages the storage, update, and retrieval of meter data hashes.
 * @custom:dev-run-script file_path
 */
contract MeterHashStorage {
    constructor(){}
    
    mapping(string => string[]) private meterHashes;

    event HashStored(string meterDID, string dataHash);
    event HashUpdated(string meterDID, uint index, string newDataHash);
    event HashRevoked(string meterDID, uint index);

    /**
     * @dev Store a new hash for a given meter DID.
     * @param meterDID Decentralized identifier for the meter.
     * @param dataHash Hash of the meter's data.
     */
    function storeHash(string calldata meterDID, string calldata dataHash) external {
        require(bytes(meterDID).length > 0, "Meter DID cannot be empty");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        meterHashes[meterDID].push(dataHash);
        emit HashStored(meterDID, dataHash);
    }

    /**
     * @dev Update a specific hash for a given meter DID.
     * @param meterDID Decentralized identifier for the meter.
     * @param index Index of the hash in the array.
     * @param newDataHash New hash to replace the old one.
     */
    function updateHash(string calldata meterDID, uint index, string calldata newDataHash) external {
        require(index < meterHashes[meterDID].length, "Index out of bounds");
        require(bytes(newDataHash).length > 0, "New data hash cannot be empty");
        meterHashes[meterDID][index] = newDataHash;
        emit HashUpdated(meterDID, index, newDataHash);
    }

    /**
     * @dev Revoke a specific hash for a given meter DID.
     * @param meterDID Decentralized identifier for the meter.
     * @param index Index of the hash in the array to revoke.
     */
    function revokeHash(string calldata meterDID, uint index) external {
    require(index < meterHashes[meterDID].length, "Index out of bounds");
    uint lastIndex = meterHashes[meterDID].length - 1;
    
    // Remove the element at the specified index by shifting all elements down by one.
    for (uint i = index; i < lastIndex; i++) {
        meterHashes[meterDID][i] = meterHashes[meterDID][i + 1];
    }
    
    // Pop the last element which is now a duplicate after shifting
    meterHashes[meterDID].pop();
    emit HashRevoked(meterDID, index);
}

    /**
     * @dev Retrieve all stored hashes for a given meter DID.
     * @param meterDID Decentralized identifier for the meter.
     * @return Array of stored data hashes.
     */
    function getHashes(string calldata meterDID) external view returns (string[] memory) {
        return meterHashes[meterDID];
    }
}