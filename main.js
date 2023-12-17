const readline = require('readline');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const crypto = require('crypto');
const fastcsv = require('fast-csv');
const { v4: uuidv4 } = require('uuid');
const { Web3 } = require('web3');

require('dotenv').config();

// Contract ABI
const contractABI = [ [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "string", "name": "meterDID", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "HashRevoked", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "string", "name": "meterDID", "type": "string" }, { "indexed": false, "internalType": "string", "name": "dataHash", "type": "string" } ], "name": "HashStored", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "string", "name": "meterDID", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "newDataHash", "type": "string" } ], "name": "HashUpdated", "type": "event" }, { "inputs": [ { "internalType": "string", "name": "meterDID", "type": "string" } ], "name": "getHashes", "outputs": [ { "internalType": "string[]", "name": "", "type": "string[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "meterDID", "type": "string" }, { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "revokeHash", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "meterDID", "type": "string" }, { "internalType": "string", "name": "dataHash", "type": "string" } ], "name": "storeHash", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "meterDID", "type": "string" }, { "internalType": "uint256", "name": "index", "type": "uint256" }, { "internalType": "string", "name": "newDataHash", "type": "string" } ], "name": "updateHash", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]];

// Configure Web3 instance for Volta Testnet
const web3 = new Web3('https://volta-rpc.energyweb.org');
const contractAddress = '0x05ECb2781C09b57d8C2eeA886f015D340FFcc993';
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Mock smart contract interaction function
const sendHashToContract = async (hash) => {
    // Simulate sending hash to the smart contract
    console.log(`Hash sent to the contract: ${hash}`);
    // interaction with the smart contract 
}

// Function to read meter data from CSV
async function readMeterData(meterId) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data', 'meter_data.csv'), (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const records = parse(data, {
                columns: true,
                skip_empty_lines: true
            });

            for (let row of records) {
                if (row && row["Meter ID"].trim() === meterId) {
                    resolve(row);
                    return;
                }
            }

            console.log(`No data found for Meter ID: ${meterId}`);
            resolve(null);
        });
    });
}

// Function to read meter DID from CSV
async function readMeterDID(meterId) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, 'data', 'meters.csv'))
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', (row) => {
                if (row["Meter ID"].trim() === meterId) {
                    resolve(row["DID"]);
                    this.destroy();
                }
            })
            .on('end', () => {
                console.log(`No DID found for Meter ID: ${meterId}`);
                resolve(null);
            })
            .on('error', (error) => {
                console.error('Error reading DID CSV file:', error.message);
                reject(error);
            });
    });
}

// Function to generate a hash
const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Function to create and store a VC
const createAndStoreVC = (data, did, hash) => {
    const sanitizedDid = did.replace(/[:]/g, '_'); // Replace colons with underscores
    const vc = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: `urn:uuid:${uuidv4()}`,
        type: ['VerifiableCredential'],
        issuer: did,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: did,
            meterData: data,
            hash: hash
        }
    };

    try {
        if (!fs.existsSync('vcs')) {
            fs.mkdirSync('vcs');
        }
        fs.writeFileSync(`vcs/${sanitizedDid}.json`, JSON.stringify(vc, null, 2));
        console.log(`VC for DID: ${sanitizedDid} written to file.`);
    } catch (error) {
        console.error('Error writing VC to file:', error);
    }
};

// Main function to process meter data
const processMeterData = async (meterId) => {
    const meterData = await readMeterData(meterId);
    const meterDID = await readMeterDID(meterId);

    if (meterData && meterDID) {
        const hash = generateHash(meterData);
        createAndStoreVC(meterData, meterDID, hash);
        await storeHashInContract(meterDID, hash);
    } else {
        console.log('No data or DID found for the given meter ID.');
    }
};

// Simulated function to generate a private key from a DID
const generatePrivateKeyFromDID = (did) => {
    return crypto.createHash('sha256').update(did).digest('hex');
};

// Function to store hash in the smart contract
const storeHashInContract = async (did, hash) => {
    try {
        const privateKey = generatePrivateKeyFromDID(did);
        const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
        web3.eth.accounts.wallet.add(account);

        const receipt = await contract.methods.storeHash(did, hash).send({
            from: account.address,
            gas: 1000000
        });

        console.log(`Hash stored in contract: ${receipt.transactionHash}`);
    } catch (error) {
        console.error('Error storing hash in contract:', error);
    }
};

// Create readline interface for input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Prompt user for Meter ID
  rl.question('Enter meter ID: ', (meterId) => {
    processMeterData(meterId);
  });
  
  rl.on('close', () => {
    console.log('Exiting the application...');
    process.exit(0);
  });
