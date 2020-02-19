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

const verifyEmail = (email) => {
  // loop through the users object
  // verify if email input already exists
  for (const key of Object.keys(users)) {
    if (users[key].email === email) {
      return true;
    }
  }
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render('register', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  // list formatted urls in database
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  // get request, post command in rendered form
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"],
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
  // conditionals if user exists or empty strings entered
  if (req.body.email === "" || req.body.password === "" || verifyEmail(req.body.email) === true) {
    // return response 400
    res.statusCode = 400;
    res.send(res.statusCode);
  } else {
    const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: req.body.password
    };
    // console.log(`verify email: ${verifyEmail(req.body.email)}`);
    res.cookie('user_id', users[user_id]);
  }
  console.log(users);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  // store cookies when logging in
  res.cookie('user_id', req.body.user_id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // clear cookies upon logging out
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});