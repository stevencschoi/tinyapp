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

// string generator for 6 character URL
const generateRandomString = () => {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// check inputted password with user object password
// const verifyPassword = (email, password) => {
//   const user = getUserByEmail(email);
//   if (!user) {
//     return false;
//   } else {
//     if (password === user.password) {
//       return true;
//     } else {
//       return false;
//     }
//   }
// };

// create user url database
const urlsForUser = id => {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = urlDatabase[url].longURL;
    }
  }
  return userDatabase;
};

app.get('/', (req, res) => {
  res.send('Hello!');
  // res.redirect('/login');
});

app.get('/register', (req, res) => {
  const templateVars = {
    userId: req.session["userId"]
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // create user ID & store user info
  // conditionals if user exists or empty strings entered
  if (req.body.email === "" || req.body.password === "" || verifyEmail(req.body.email, users) === true) {
    res.send(res.statusCode = 400);
  } else {
    const userId = generateRandomString();
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: hashPassword
      // password: req.body.password
    };
    req.session.userId = users[userId];
  }
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = {
    userId: req.session["userId"]
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (bcrypt.compareSync(req.body.password, user.password) === false) {
  // if (!verifyPassword(req.body.email, req.body.password)) {
    res.status(403).send('Forbidden');
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
      urls: urlsForUser(req.session.userId.id),
      userId: req.session["userId"]
    };
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post('/urls', (req, res) => {
  // generate key value pair for user input longURL
  urlDatabase[generateRandomString()] = {
    longURL: req.body.longURL,
    userID: req.session.userId.id
  };
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  if (req.session.userId) {
    const templateVars = {
      userId: req.session["userId"]
    };
    res.render('urls_new', templateVars);
  } else {
    // if not logged in, redirect to login page
    res.redirect('/login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userId: req.session["userId"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL/update', (req, res) => {
  if (req.session.userId.id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL] && req.cookies.userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.post('/logout', (req, res) => {
  // clear cookies upon logging out
  res.clearCookie('userId');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});