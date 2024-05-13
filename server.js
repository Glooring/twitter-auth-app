const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;

const app = express();
const port = process.env.PORT || 3000;

const consumerKey = 'v71tqJheXMkovRUcb5UGfylps';
const consumerSecret = 'uT6fY1GKYlQbmyAK2QpTGzvzVMnWnAKSdqfcubeG6cwh0cfyfa';
const callbackURL = 'https://twitter-auth-app.vercel.app/callback';

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Use the TwitterStrategy within Passport
passport.use(new TwitterStrategy({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callbackURL: callbackURL
  },
  (token, tokenSecret, profile, done) => {
    process.nextTick(() => {
      return done(null, profile);
    });
  }
));

// Express middleware setup
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('<a href="/auth/twitter">Sign in with Twitter</a>');
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/callback', passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/profile');
});

app.get('/profile', ensureAuthenticated, (req, res) => {
  res.send(`Hello, ${req.user.username}!`);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Serve terms of service and privacy policy
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
