// Required modules
const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('@octokit/core');
const fs = require('fs');
const { Parser } = require('json2csv');

// GitHub App credentials
const APP_ID = 'YOUR_APP_ID';
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT
-----END RSA PRIVATE KEY-----`;

// Organization name
const ORGANIZATION = 'YOUR_ORGANIZATION_NAME';

// Function to get an authenticated Octokit instance
async function getOctokit() {
    const auth = createAppAuth({
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
    });

    // Get the installation ID for the organization
    const installationAuthentication = await auth({
        type: 'installation',
        installationId: YOUR_INSTALLATION_ID, // Replace with your installation ID
    });

    const octokit = new Octokit({
        auth: installationAuthentication.token,
    });

    return octokit;
}

// Function to fetch members of an organization
async function fetchMembers(octokit) {
    let page = 1;
    const perPage = 100;
    let members = [];

    while (true) {
        const response = await octokit.request('GET /orgs/{org}/members', {
            org: ORGANIZATION,
            per_page: perPage,
            page: page,
        });

        if (response.data.length === 0) {
            break;
        }

        members = members.concat(response.data);
        page++;
    }

    return members;
}

// Function to fetch user details
async function fetchUserDetails(octokit, username) {
    const response = await octokit.request('GET /users/{username}', {
        username: username,
    });

    return response.data;
}

// Main function
async function main() {
    try {
        const octokit = await getOctokit();
        const members = await fetchMembers(octokit);
        const usersData = [];

        for (const member of members) {
            const userDetails = await fetchUserDetails(octokit, member.login);

            usersData.push({
                username: userDetails.login,
                name: userDetails.name || '',
                email: userDetails.email || '',
            });
        }

        // Export to CSV
        const fields = ['username', 'name', 'email'];
        const parser = new Parser({ fields });
        const csv = parser.parse(usersData);

        fs.writeFileSync('members.csv', csv);

        console.log('CSV file has been created successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();