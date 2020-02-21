const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'userId',
  keys: ['strings']
}));
const bcrypt = require('bcrypt');
app.set('view engine', 'ejs');
app.use(morgan('dev'));

const { generateRandomString } = require('./helpers.js');
const { getUserByEmail } = require('./helpers.js');

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

// check inputted email to existing user object email
const verifyEmail = email => {
  let user = getUserByEmail(email, users);
  if (!user) {
    return false;
  } else {
    if (email === user.email) {
      return true;
    }
  }
};

// create filtered user url database
const urlsForUser = id => {
  let userDatabase = {};
  for (let url in urlDatabase) {
    // if user id matches database id, return associated urls
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = urlDatabase[url].longURL;
    }
  }
  return userDatabase;
};

app.get('/', (req, res) => {
  // res.send('Hello!');
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.session.userId],
    email: req.body.email,
    userId: req.session.userId
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // create & store user info
  // conditionals if user exists or empty strings entered
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send('Bad request');
  } else if (verifyEmail(req.body.email, users)) {
    return res.status(401).send('This account already exists');
  } else {
    // create user object and add to database
    const userId = generateRandomString();
    // encrypt password
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: hashPassword
      // password: req.body.password
    };
    // store only the userId as cookie for security purposes
    req.session.userId = userId;
  }
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = {
    userId: req.session["userId"],
    user: users[req.session.userId],
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  // return user from database
  const user = getUserByEmail(req.body.email, users);
  // if email is not in database, return 400
  if (!verifyEmail(req.body.email)) {
    return res.status(400).send('Bad response');
  }
  // verify password and direct accordingly
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(403).send('Forbidden');
  } else {
    req.session.userId = user.id;
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  if (req.session.userId) {
    const templateVars = {
      // display url database if user is logged in (verified with presence of cookies)
      user: users[req.session.userId],
      urls: urlsForUser(req.session.userId),
      userId: req.session["userId"]
    };
    return res.render('urls_index', templateVars);
  } else {
    // made a decision that a redirect to the login page is functionally more useful than an expected error message to the user to log in
    res.redirect('/login');
  }
});

app.post('/urls', (req, res) => {
  // generate identifier for urlDatabase
  const userCode = generateRandomString();
  urlDatabase[userCode] = {
    longURL: req.body.longURL,
    userID: req.session.userId
  };
  // use urlDatabase identifier to redirect to new page
  res.redirect(`/urls/${userCode}`);
});

// redirects to form to create url if logged in
app.get('/urls/new', (req, res) => {
  if (req.session.userId) {
    const templateVars = {
      user: users[req.session.userId],
      userId: req.session["userId"]
    };
    return res.render('urls_new', templateVars);
  } else {
    // if not logged in, redirect to login page
    res.redirect('/login');
  }
});

// redirect to long URL if accessing short URL
app.get('/u/:shortURL', (req, res) => {
  // check if url exists
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('Page not found');
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// display short URL with ability to update (if logged in)
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userId: req.session["userId"],
    user: users[req.session.userId],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };

  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('Page not found');
  }

  if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
    return res.render('urls_show', templateVars);
  } else {
    res.status(403).send('You are not authorized to view this page');
  }
});

// update existing URL with new address in a user's URLs
app.post('/urls/:shortURL/update', (req, res) => {
  if (req.params.shortURL) {
    if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      res.redirect('/urls');
    } else {
      res.status(401).send('You are not authorized to view this page');
    }
  } else {
    res.status(404).send('Page not found');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('Page not found');
  }
  // delete url record if user ID matches associated ID on url
  if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.post('/logout', (req, res) => {
  // clear cookies upon logging out
  req.session = null;
  // redirects to urls which redirects to login...
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});