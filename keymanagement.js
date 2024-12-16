// Import necessary modules
const inquirer = require('inquirer');
const fs = require('fs');
const csv = require('csv-parser');
const vault = require('node-vault');
const { Octokit } = require('@octokit/core');
const { createAppAuth } = require('@octokit/auth-app');

// GitHub App credentials
const APP_ID = 'YOUR_APP_ID';
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT
-----END RSA PRIVATE KEY-----`;
const INSTALLATION_ID = 'YOUR_INSTALLATION_ID'; // Replace with your installation ID

// Initialize Vault client
const vaultClient = vault({
    apiVersion: 'v1',
    endpoint: 'https://your-vault-server:8200', // Replace with your Vault server URL
    token: 'YOUR_VAULT_TOKEN', // Replace with your Vault token
});

// Function to get an authenticated Octokit instance using GitHub App credentials
async function getOctokit() {
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: APP_ID,
            privateKey: PRIVATE_KEY,
            installationId: INSTALLATION_ID,
        },
    });

    // Authenticate and get the token
    const auth = await octokit.auth({
        type: 'installation',
    });

    return new Octokit({
        auth: auth.token,
    });
}

// Function to read emails from CSV file
function readEmailsFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        const users = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.email && row.username) { // Ensure both email and username are present
                    users.push({ email: row.email, username: row.username });
                }
            })
            .on('end', () => {
                resolve(users);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Function to fetch key from Vault
async function fetchKeyFromVault(email, keyType) {
    try {
        const secretPath = `path/to/keys/${email}/${keyType.toLowerCase()}_key`; // Adjust the path as needed
        const vaultRes = await vaultClient.read(secretPath);
        const key = vaultRes.data.data[`${keyType.toLowerCase()}_key`];
        return key;
    } catch (error) {
        console.error(`Error fetching ${keyType} key for ${email}:`, error.message);
        return null;
    }
}

// Function to add SSH key to GitHub user
async function addSshKey(octokit, username, key) {
    try {
        await octokit.request('POST /users/{username}/keys', {
            username: username,
            title: `SSH Key for ${username}`,
            key: key,
        });
        console.log(`Successfully added SSH key for ${username}`);
    } catch (error) {
        console.error(`Error adding SSH key for ${username}:`, error.message);
    }
}

// Function to add GPG key to GitHub user
async function addGpgKey(octokit, username, key) {
    try {
        await octokit.request('POST /users/{username}/gpg_keys', {
            username: username,
            armored_public_key: key,
        });
        console.log(`Successfully added GPG key for ${username}`);
    } catch (error) {
        console.error(`Error adding GPG key for ${username}:`, error.message);
    }
}

// Main function
async function main() {
    // Prompt user to choose between SSH and GPG keys
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'keyType',
            message: 'Which keys do you want to transfer?',
            choices: ['SSH', 'GPG'],
        },
        {
            type: 'input',
            name: 'csvFilePath',
            message: 'Enter the path to the CSV file containing user emails and usernames:',
            validate: function (input) {
                if (fs.existsSync(input)) {
                    return true;
                }
                return 'File does not exist. Please enter a valid file path.';
            },
        },
    ]);

    const { keyType, csvFilePath } = answers;

    // Read users from CSV file
    let users;
    try {
        users = await readEmailsFromCSV(csvFilePath);
        if (users.length === 0) {
            console.error('No valid user entries found in the CSV file.');
            return;
        }
    } catch (error) {
        console.error('Error reading CSV file:', error.message);
        return;
    }

    // Get authenticated Octokit instance
    let octokit;
    try {
        octokit = await getOctokit();
    } catch (error) {
        console.error('Error authenticating with GitHub App:', error.message);
        return;
    }

    // Process each user
    for (const user of users) {
        const { email, username } = user;
        if (!username) {
            console.warn(`Skipping user with email ${email} as username is missing.`);
            continue;
        }

        // Fetch the key from Vault
        const key = await fetchKeyFromVault(email, keyType);
        if (!key) {
            console.warn(`No ${keyType} key found for ${email}. Skipping.`);
            continue;
        }

        // Add the key to GitHub
        if (keyType === 'SSH') {
            await addSshKey(octokit, username, key);
        } else if (keyType === 'GPG') {
            await addGpgKey(octokit, username, key);
        }
    }

    console.log('Key management process completed.');
}

main().catch((error) => {
    console.error('Unhandled Error:', error.message);
});