const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fastcsv = require('fast-csv');
const Web3 = require('web3');
require('dotenv').config();

// Configure Web3 instance for Volta Testnet
const web3 = new Web3(new Web3.providers.HttpProvider('https://volta-rpc.energyweb.org'));

// Mock smart contract interaction function
const sendHashToContract = async (hash) => {
    // Simulate sending hash to the smart contract
    console.log(`Hash sent to the contract: ${hash}`);
    // interaction with the smart contract 
}

// Function to read meter data from CSV
function readMeterData(meterId, callback) {
    let data = [];
    fs.createReadStream(path.join(__dirname, 'meter_data.csv'))
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => {
        if (row.id === meterId) {
          data.push(row);
        }
      })
      .on('end', () => {
        callback(data);
      });
  }

// Function to generate a mock DID
const generateDID = () => {
    return `did:ewc:${uuidv4()}`;
}

// Function to generate a hash
const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Function to create and store a VC
const createAndStoreVC = (data, did, hash) => {
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
    fs.writeFileSync(`vcs/${did}.csv`, JSON.stringify(vc) + '\n');
}

// Main function to process meter data
const processMeterData = (meterId) => {
    readMeterData(meterId, (data) => {
        if (data.length > 0) {
            console.log(`Processing data for Meter ID: ${meterId}`);
            const did = generateDID();
            data.forEach(record => {
                const hash = generateHash(record);
                createAndStoreVC(record, did, hash);
                sendHashToContract(hash);
            });
        } else {
            console.log('No data found for the given meter ID.');
        }
    });
}

// Create readline interface for input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Prompt user for Meter ID
  rl.question('Enter the Meter ID: ', (meterId) => {
    processMeterData(meterId);
    rl.close();
  });
  
  rl.on('close', () => {
    console.log('Exiting the application...');
    process.exit(0);
  });
