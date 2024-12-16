// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle form submission
app.post('/execute', (req, res) => {
    const { appId, privateKey, installationId, vaultToken, vaultEndpoint, githubToken, organization } = req.body;

    // Set environment variables
    process.env.APP_ID = appId;
    process.env.PRIVATE_KEY = privateKey;
    process.env.INSTALLATION_ID = installationId;
    process.env.VAULT_TOKEN = vaultToken;
    process.env.VAULT_ENDPOINT = vaultEndpoint;
    process.env.GITHUB_TOKEN = githubToken;
    process.env.ORGANIZATION = organization;

    // Execute identities.js
    exec('node identities.js', (error, stdout, stderr) => {
        if (error) {
            return res.send(`Error executing identities.js: ${stderr}`);
        }
        // Execute keymanagement.js after identities.js completes
        exec('node keymanagement.js', (err, out, serr) => {
            if (err) {
                return res.send(`Error executing keymanagement.js: ${serr}`);
            }
            res.send(`Success:\n${stdout}\n${out}`);
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});