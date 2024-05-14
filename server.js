const express = require('express');
const OAuth = require('oauth').OAuth;
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();  // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// Twitter API credentials
const consumerKey = process.env.API_KEY;;
const consumerSecret = process.env.API_SECRET_KEY;
const callbackURL = 'https://twitter-auth-app.vercel.app/callback';

// Telegram bot token and chat ID
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Initialize Telegram bot
const bot = new TelegramBot(telegramBotToken, { polling: true });

// Store OAuth tokens
let oauthAccessToken = '';
let oauthAccessTokenSecret = '';
let twitterHandle = 'TheRoaringKitty';


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

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Tracking Twitter account: https://twitter.com/${twitterHandle}`);
});

// Handle the /new command
bot.onText(/\/new/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Please send the new Twitter account handle you want to track (without @).');
  bot.once('message', (response) => {
    if (response.text.startsWith('@')) {
      bot.sendMessage(msg.chat.id, 'Please send the handle without the @ symbol.');
    } else {
      twitterHandle = response.text;
      lastTweetId = null; // Reset the lastTweetId to track new tweets from the new handle
      bot.sendMessage(msg.chat.id, `Now tracking Twitter account: https://twitter.com/${twitterHandle}`);
    }
  });
});



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

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
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
    console.error('Error fetching tweets:', error.response ? error.response.data : error.message);
  }
};

// Function to send Telegram message
const sendTelegramMessage = (message) => {
  bot.sendMessage(chatId, message)
    .then(response => {
      console.log('Message sent to Telegram:', response.text);
    })
    .catch(error => {
      console.error('Error sending message to Telegram:', error.message);
    });
};


// Function to check for new tweets
let lastTweetId = null;
const checkForNewTweets = async () => {
  const tweets = await fetchLatestTweets('TheRoaringKitty');
  if (tweets && tweets.length > 0) {
    const latestTweet = tweets[0];
    if (latestTweet.id_str !== lastTweetId) {
      console.log('New tweet found:', latestTweet.text);
      // Send Telegram notification
      sendTelegramMessage(`New tweet from TheRoaringKitty: ${latestTweet.text}`);
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