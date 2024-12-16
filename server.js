const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const { getNonce } = require('./nonce');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const nonce = getNonce();
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'nonce-${nonce}';">
        </head>
        <body>
          <!-- Your content -->
          <script nonce="${nonce}" src="your-script.js"></script>
        </body>
        </html>
      `);
});

app.post('/execute', (req, res) => {
    const { appId, privateKey, installationId, vaultToken, vaultEndpoint, githubToken, organization } = req.body;

    if (!appId || !privateKey || !installationId || !vaultToken || !vaultEndpoint || !githubToken || !organization) {
        return res.send('Missing required fields');
    }

    // Set environment variables
    process.env.APP_ID = appId;
    process.env.PRIVATE_KEY = privateKey;
    process.env.INSTALLATION_ID = installationId;
    process.env.VAULT_TOKEN = vaultToken;
    process.env.VAULT_ENDPOINT = vaultEndpoint;
    process.env.GITHUB_TOKEN = githubToken;
    process.env.ORGANIZATION = organization;

    exec('node identities.js', (error, stdout, stderr) => {
        if (error) {
            return res.send(`Error executing identities.js: ${stderr}`);
        }
        exec('node keymanagement.js', (err, out, serr) => {
            if (err) {
                return res.send(`Error executing keymanagement.js: ${serr}`);
            }
            res.send(`Success:\n${stdout}\n${out}`);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});