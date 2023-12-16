contract("MeterHashStorage", () => {
  let meterHashStorage;

  beforeEach(async () => {
    meterHashStorage = await MeterHashStorage.new();
  });

  it("should store a hash for a given meter DID", async () => {
    const meterDID = "did:ewc:0x123";
    const dataHash = "0x123";

    await meterHashStorage.storeHash(meterDID, dataHash);
    const storedHashes = await meterHashStorage.getHashes(meterDID);

    assert.equal(storedHashes.length, 1, "There should be one hash stored for the meter.");
    assert.equal(storedHashes[0], dataHash, "The stored hash does not match the input hash.");
  });

  it("should handle multiple hashes for a single meter", async () => {
    const meterDID = "did:ewc:0x123";
    const dataHash1 = "0xaaa";
    const dataHash2 = "0xbbb";

    await meterHashStorage.storeHash(meterDID, dataHash1);
    await meterHashStorage.storeHash(meterDID, dataHash2);
    const storedHashes = await meterHashStorage.getHashes(meterDID);

    assert.equal(storedHashes.length, 2, "Incorrect number of hashes stored.");
    assert.equal(storedHashes[0], dataHash1, "First hash mismatch.");
    assert.equal(storedHashes[1], dataHash2, "Second hash mismatch.");
  });

  it("should update a hash", async () => {
    const meterDID = "did:ewc:0x123";
    const dataHash = "0x123";
    const updatedHash = "0x456";

    await meterHashStorage.storeHash(meterDID, dataHash);
    await meterHashStorage.updateHash(meterDID, 0, updatedHash);
    const storedHashes = await meterHashStorage.getHashes(meterDID);

    assert.equal(storedHashes[0], updatedHash, "The hash was not updated correctly.");
  });

  it("should revoke a hash", async () => {
    const meterDID = "did:ewc:0x123";
    const dataHash = "0x123";

    await meterHashStorage.storeHash(meterDID, dataHash);
    await meterHashStorage.revokeHash(meterDID, 0);
    const storedHashes = await meterHashStorage.getHashes(meterDID);

    assert.equal(storedHashes.length, 0, "The hash was not revoked correctly.");
  });

  it("should handle invalid hash index for update and revoke", async () => {
    const meterDID = "did:ewc:0x123";
    const dataHash = "0x123";

    await meterHashStorage.storeHash(meterDID, dataHash);

    try {
      await meterHashStorage.updateHash(meterDID, 1, "0x456");
      assert.fail("Should throw an error for invalid index");
    } catch (error) {
      assert.include(error.message, "Index out of bounds", "Expected 'Index out of bounds' error");
    }

    try {
      await meterHashStorage.revokeHash(meterDID, 1);
      assert.fail("Should throw an error for invalid index");
    } catch (error) {
      assert.include(error.message, "Index out of bounds", "Expected 'Index out of bounds' error");
    }
  });
});
