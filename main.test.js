const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const { Web3 } = require('web3');
const {
    generateHash,
    createAndStoreVC,
} = require('./main');
jest.mock('fs');
jest.mock('web3');

let mockData;

// Mock Web3 and contract interaction
const mockSendMethod = jest.fn();
jest.mock('web3', () => {
  return {
    Web3: jest.fn().mockImplementation(() => {
      return {
        eth: {
          Contract: jest.fn().mockImplementation(() => {
            return {
              methods: {
                storeHash: jest.fn(() => ({
                  send: mockSendMethod
                }))
              }
            };
          }),
          accounts: {
            privateKeyToAccount: jest.fn().mockReturnValue({ address: '0x123' }),
            wallet: {
              add: jest.fn()
            }
          }
        }
      };
    })
  };
});

beforeEach(() => {
  mockData = {
    meterDataCsv: 'Meter ID,Timestamp,Counter,Consumption\n1001,2022-12-01T12:00:00,2500,15.5',
    metersCsv: 'Meter ID,DID\n1001,did:ewc:0xc9Fc54b40453db70425D42f03521391D94e7B0b6'
  };

  fs.readFileSync.mockImplementation((path) => {
    if (path.includes('meter_data.csv')) {
      return mockData.meterDataCsv;
    }
    if (path.includes('meters.csv')) {
      return mockData.metersCsv;
    }
    throw new Error('File not found');
  });

  mockSendMethod.mockResolvedValue({ transactionHash: '0xabc123' });
});

afterEach(() => {
  jest.clearAllMocks();
});

/* // Test for readMeterData function
describe('readMeterData', () => {
    it('should return meter data for valid meter ID', async () => {
      fs.readFile.mockImplementation((path, callback) => {
        callback(null, mockData.meterDataCsv); // Immediately invoke callback with mock data
      });
  
      const data = await readMeterData('1001');
      expect(data).toEqual({
        'Meter ID': '1001',
        'Timestamp': '2022-12-01T12:00:00',
        'Counter': '2500',
        'Consumption': '15.5'
      });
    });
  
    it('should return null for invalid meter ID', async () => {
      const data = await readMeterData('9999');
      expect(data).toBeNull();
    });
  });  

// Test for readMeterDID function
describe('readMeterDID', () => {
    const mockMetersCsv = 'Meter ID,DID\n1001,did:ewc:0xc9Fc54b40453db70425D42f03521391D94e7B0b6';

    beforeEach(() => {
        jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
            const mockStream = {
                on: (event, handler) => {
                    if (event === 'data') {
                        handler(mockMetersCsv); // Simulate streaming data
                    }
                    if (event === 'end') {
                        handler(); // Simulate end of stream
                    }
                    return mockStream;
                },
            };
            return mockStream;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return DID for valid meter ID', async () => {
        const did = await readMeterDID('1001');
        expect(did).toEqual('did:ewc:0xc9Fc54b40453db70425D42f03521391D94e7B0b6');
    });

    it('should return null for invalid meter ID', async () => {
        const did = await readMeterDID('9999');
        expect(did).toBeNull();
    });
}); */

// Test for generateHash function
describe('generateHash', () => {
    it('should generate a SHA-256 hash of the provided data', () => {
      const testData = { key: 'value' };
      const expectedHash = 'e43abcf3375244839c012f9633f95862d232a95b00d5bc7348b3098b9fed7f32';
      const hash = generateHash(testData);
      expect(hash).toEqual(expectedHash);
    });
  });

// Test for createAndStoreVC function
describe('createAndStoreVC', () => {
    it('should create VC and write to file', () => {
      const testData = { 'Meter ID': '1001', 'Timestamp': '2022-12-01T12:00:00', 'Counter': '2500', 'Consumption': '15.5' };
      const did = 'did:ewc:0xc9Fc54b40453db70425D42f03521391D94e7B0b6';
      const hash = generateHash(testData);
      createAndStoreVC(testData, did, hash);
      const sanitizedDid = did.replace(/[:]/g, '_');
      expect(fs.writeFileSync).toHaveBeenCalledWith(`vcs/${sanitizedDid}.json`, expect.any(String));
    });
  });
