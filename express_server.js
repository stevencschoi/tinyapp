const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(morgan('dev'));

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// string generator for 6 character URL
const generateRandomString = () => {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// const lookupEmail = () => {

// };

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  // list formatted urls in database
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  // get request, post command in rendered form
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  // generate key value pair for user input longURL
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  // update longURL in database with user input
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  // create user ID & store user info
  if (req.body.email === "" || req.body.password === "") {
    // return response 400
  } else {
    users[generateRandomString()] = {
      id: req.body.id,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', req.body.id);
  }
  console.log(users);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  // store cookies when logging in
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // clear cookies upon logging out
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});