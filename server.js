const express = require('express');
const OAuth = require('oauth').OAuth;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Twitter API credentials
const consumerKey = 'v71tqJheXMkovRUcb5UGfylps';
const consumerSecret = 'uT6fY1GKYlQbmyAK2QpTGzvzVMnWnAKSdqfcubeG6cwh0cfyfa';
const callbackURL = 'https://twitter-auth-app.vercel.app/callback';

// Initialize OAuth
const twitterOAuth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    consumerKey,
    consumerSecret,
    '1.0A',
    callbackURL,
    'HMAC-SHA1'
);

// Twitter authentication route
app.get('/auth/twitter', (req, res) => {
    twitterOAuth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
        if (error) {
            res.send('Authentication failed!');
        } else {
            res.redirect(`https://twitter.com/oauth/authenticate?oauth_token=${oauthToken}`);
        }
    });
});

// Callback URL route
app.get('/callback', (req, res) => {
    const oauthToken = req.query.oauth_token;
    const oauthVerifier = req.query.oauth_verifier;
    twitterOAuth.getOAuthAccessToken(oauthToken, null, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        if (error) {
            res.send('Authentication failed!');
        } else {
            res.send('Authentication successful!');
        }
    });
});

// Serve terms of service and privacy policy
app.use('/terms', express.static(path.join(__dirname, 'public/terms.html')));
app.use('/privacy', express.static(path.join(__dirname, 'public/privacy.html')));

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Twitter OAuth App');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});