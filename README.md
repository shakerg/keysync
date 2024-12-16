# Key Management
Converted to a GitHub App

## Install the required packages:
`npm install json2csv fs @octokit/core @octokit/auth-app inquirer csv-parser node-vault`

## What is the GitHub App?
The App fetches all members of the specified organization(s).
It retrieves public user details like username, name, and email using the GitHub API and stores them in a CSV file.
The email field of the CSV file will be used to fetch the SSH or GPG keys from HashiCorp Vault.
The SSH or GPG keys are then uploaded to the GitHub members profiles (maybe).

# The GitHub APP
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
