const express = require('express');
const OAuth = require('oauth').OAuth;

const app = express();
const port = process.env.PORT || 3000;

const consumerKey = 'v71tqJheXMkovRUcb5UGfylps';
const consumerSecret = 'uT6fY1GKYlQbmyAK2QpTGzvzVMnWnAKSdqfcubeG6cwh0cfyfa';
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
      res.send('Authentication failed!');
    } else {
      res.redirect(`https://twitter.com/oauth/authenticate?oauth_token=${oauthToken}`);
    }
  });
});

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
