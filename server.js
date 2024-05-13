const express = require('express');
const OAuth = require('oauth').OAuth;
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const port = process.env.PORT || 3000;

// Twitter API credentials
const consumerKey = 'v71tqJheXMkovRUcb5UGfylps';
const consumerSecret = 'uT6fY1GKYlQbmyAK2QpTGzvzVMnWnAKSdqfcubeG6cwh0cfyfa';
const callbackURL = 'https://twitter-auth-app.vercel.app/callback';

// Store OAuth tokens
let oauthAccessToken = '';
let oauthAccessTokenSecret = '';

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
    twitterOAuth.getOAuthAccessToken(oauthToken, null, oauthVerifier, (error, _oauthAccessToken, _oauthAccessTokenSecret, results) => {
        if (error) {
            res.send('Authentication failed!');
        } else {
            oauthAccessToken = _oauthAccessToken;
            oauthAccessTokenSecret = _oauthAccessTokenSecret;
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

// Function to fetch latest tweets from a user
const fetchLatestTweets = async (screenName) => {
    const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${screenName}&count=1`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `OAuth oauth_consumer_key="${consumerKey}", oauth_token="${oauthAccessToken}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${Math.floor(new Date().getTime() / 1000)}", oauth_nonce="${Math.random().toString(36).substring(7)}", oauth_version="1.0"`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching tweets:', error);
    }
};

// Function to check for new tweets
let lastTweetId = null;
const checkForNewTweets = async () => {
    const tweets = await fetchLatestTweets('TheRoaringKitty');
    if (tweets && tweets.length > 0) {
        const latestTweet = tweets[0];
        if (latestTweet.id_str !== lastTweetId) {
            console.log('New tweet found:', latestTweet.text);
            // Replace this with actual notification logic
            // For example, send an email or a push notification
            lastTweetId = latestTweet.id_str;
        }
    }
};

// Schedule the tweet check to run every minute
cron.schedule('* * * * *', () => {
    if (oauthAccessToken && oauthAccessTokenSecret) {
        checkForNewTweets();
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
