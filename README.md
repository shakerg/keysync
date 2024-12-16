README.md

# Key Management

## Install the required packages:
`npm install inquirer csv-parser node-vault axios`

## Notes:

Replace 'https://your-vault-server:8200' with your Vault server URL.
Replace 'YOUR_VAULT_TOKEN' with your Vault token.
Replace 'YOUR_GITHUB_TOKEN' with your GitHub personal access token with the necessary scopes.
Ensure the CSV file has a column named email containing the user email addresses.
Adjust the secretPath according to your Vault's key storage path.
Make sure your Vault and GitHub tokens have the permissions required.


# Identies

## Install Dependencies:
`npm install axios json2csv`

## Replace Placeholders:

Replace 'YOUR_GITHUB_TOKEN' with your GitHub personal access token.
Replace 'YOUR_ORGANIZATION_NAME' with the name of your GitHub organization.
Run the Script:

`node your_script_name.js`

## Notes:

The script fetches all members of the specified organization.
It retrieves public user details like username, name, and email.
The email field will only contain data if the user has made their email public.
The resulting data is exported to a members.csv file.

# The GitHub APP

Replace Placeholders
YOUR_APP_ID: Replace with your GitHub App's ID.
YOUR_PRIVATE_KEY_CONTENT: Replace with the content of your GitHub App's private key.
YOUR_INSTALLATION_ID: Replace with your GitHub App's installation ID for the organization.
YOUR_ORGANIZATION_NAME: Replace with the name of your organization.

- Obtain the Installation ID
To find your GitHub App's installation ID for the organization:

```
// Function to get installation ID
async function getInstallationId() {
  const auth = createAppAuth({
    appId: APP_ID,
    privateKey: PRIVATE_KEY,
  });

  const appOctokit = new Octokit({ authStrategy: createAppAuth, auth: { appId: APP_ID, privateKey: PRIVATE_KEY } });

  const installations = await appOctokit.request('GET /app/installations');

  const installation = installations.data.find((inst) => inst.account.login === ORGANIZATION);

  if (!installation) {
    throw new Error(`Installation not found for organization ${ORGANIZATION}`);
  }

  return installation.id;
}
```

Update your getOctokit function to use this:

```
async function getOctokit() {
  const installationId = await getInstallationId();

  const auth = createAppAuth({
    appId: APP_ID,
    privateKey: PRIVATE_KEY,
    installationId,
  });

  const authentication = await auth({ type: 'installation' });

  const octokit = new Octokit({
    auth: authentication.token,
  });

  return octokit;
}
```
