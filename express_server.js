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

// const urlDatabase = {
//   'b2xVn2': 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com'
// };

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "uKN1o0" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "5DcphW" }
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

// return object from user input
const getUserByEmail = email => {
  // loop through the users object
  for (const key of Object.keys(users)) {
    if (users[key].email === email) {
      // console.log("getUserByEmail: ", users[key]);
      return users[key];
    }
  }
  return false;
};

// create user url database
const urlsForUser = id => {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = urlDatabase[url].longURL;
    }
  }
  console.log(userDatabase);
  return userDatabase;
};

// const verifyEmail = email => {
//   // loop through the users object
//   for (const key of Object.keys(users)) {
//     if (users[key].email === email) {
//       console.log("getUserByEmail: ", users[key]);
//       return true;
//     }
//   }
// };

// check inputted email to existing user object email
const verifyEmail = email => {
  let user = getUserByEmail(email);
  if (!user) {
    return false;
  } else {
    if (email === user.email) {
      return true;
    }
  }
};

// check inputted password with user object password
const verifyPassword = (email, password) => {
  const user = getUserByEmail(email);
  if (!user) {
    return false;
  } else {
    if (password === user.password) {
      return true;
    } else {
      return false;
    }
  }
};

app.get('/', (req, res) => {
  res.send('Hello!');
  // res.redirect('/login');
});

app.get('/register', (req, res) => {
  const templateVars = {
    userId: req.cookies["userId"]
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // create user ID & store user info
  // conditionals if user exists or empty strings entered
  if (req.body.email === "" || req.body.password === "" || verifyEmail(req.body.email) === true) {
    // return response 400
    res.statusCode = 400;
    res.send(res.statusCode);
  } else {
    const userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    };
    // console.log(users);
    res.cookie('userId', users[userId]);
  }
  // console.log(users);
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = {
    userId: req.cookies["userId"]
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email);
  if (!verifyPassword(req.body.email, req.body.password)) {
    res.statusCode = 403;
    res.send(res.statusCode);
  } else {
    res.cookie('userId', user);
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  // console.log(req.cookies.userId.id);
  // console.log(urlsForUser(req.cookies.userId.id));
  if (req.cookies.userId) {
    const templateVars = {
      // display url database if user is logged in (verified with presence of cookies)
      urls: urlsForUser(req.cookies.userId.id),
      userId: req.cookies["userId"]
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
    userID: req.cookies.userId.id
  };
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  if (req.cookies.userId) {
    const templateVars = {
      userId: req.cookies["userId"]
    };
    res.render('urls_new', templateVars);
  } else {
    // if not logged in, redirect to login page
    res.redirect('/login');
  }
  // get request, post command in rendered form
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userId: req.cookies["userId"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
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

app.post('/logout', (req, res) => {
  // clear cookies upon logging out
  res.clearCookie('userId');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});