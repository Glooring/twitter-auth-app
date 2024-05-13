const express = require('express');
const { OAuth } = require('oauth');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const consumerKey = process.env.API_KEY;
const consumerSecret = process.env.API_SECRET_KEY;
const callbackURL = 'https://twitter-auth-app.vercel.app/callback';

const twitterOAuth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    consumerKey,
    consumerSecret,
    '1.0A',
    callbackURL,
    'HMAC-SHA1'
);

app.get('/auth/twitter', (req, res) => {
    twitterOAuth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
        if (error) {
            console.error('Error getting OAuth request token:', error);
            res.send('Authentication failed!');
        } else {
            res.redirect(`https://twitter.com/oauth/authenticate?oauth_token=${oauthToken}`);
        }
    });
});

app.get('/callback', (req, res) => {
    const oauthToken = req.query.oauth_token;
    const oauthVerifier = req.query.oauth_verifier;

    if (!oauthToken || !oauthVerifier) {
        console.error('OAuth token or verifier missing');
        return res.send('Authentication failed!');
    }

    twitterOAuth.getOAuthAccessToken(oauthToken, null, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        if (error) {
            console.error('Error getting OAuth access token:', error);
            res.send('Authentication failed!');
        } else {
            console.log('Authentication successful!');
            console.log('OAuth Access Token:', oauthAccessToken);
            console.log('OAuth Access Token Secret:', oauthAccessTokenSecret);
            res.send('Authentication successful!');
        }
    });
});

// Serve terms of service and privacy policy
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
