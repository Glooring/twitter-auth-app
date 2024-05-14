const express = require('express');
const OAuth = require('oauth').OAuth;
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();  // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// Twitter API credentials
const consumerKey = process.env.API_KEY;;
const consumerSecret = process.env.API_SECRET_KEY;
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
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


// Function to fetch the latest tweets from a user
const fetchLatestTweets = async (screenName) => {
  const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${screenName}&count=1`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: twitterOAuth.authHeader(
          'https://api.twitter.com/1.1/statuses/user_timeline.json',
          oauthAccessToken,
          oauthAccessTokenSecret,
          'GET'
        )
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tweets:', error);
  }
};

// Endpoint to get the latest tweet
app.get('/latest-tweet', async (req, res) => {
  if (!oauthAccessToken || !oauthAccessTokenSecret) {
    return res.status(401).send('Not authenticated');
  }

  const tweets = await fetchLatestTweets('TheRoaringKitty');
  if (tweets && tweets.length > 0) {
    res.json(tweets[0]);
  } else {
    res.status(404).send('No tweets found');
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});