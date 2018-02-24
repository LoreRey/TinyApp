const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'userID',
  secret: 'fhewfhwkejfw'
}));

app.set("view engine", "ejs");

//********DATABASES********//

const urlDatabase = {
  "userRandomID": {
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK": "http://www.google.com"
  }
};

const users = {};

//users database
/*const users = {
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
}; */

//********HANDLERS********//


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//Renders urls_index page where all user shortened URLs are displayed.

app.get("/urls", (req, res) => {
  let templateVars = {
    userUrls: urlDatabase[req.session.userID],
    user: users[req.session.userID]
  }
  res.render("urls_index", templateVars);
});

//Renders urls_new for users to input a longURL to be shortened.

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  };
    if(users[req.session.userID]) {
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
});

//Displayes shortURL page for users to edit new URL.

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.session.userID]
    }
  res.render("urls_show", templateVars);
});

//Generates shortURL, saves it, and associates it with the user.

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
    if (!urlDatabase[req.session.userID]) {
      urlDatabase[req.session.userID] = {};
      urlDatabase[req.session.userID][shortURL] = req.body.longURL;
    } else {
      urlDatabase[req.session.userID][shortURL] = req.body.longURL;
    }
    console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

//Allows non-users to click on shortURL and directs to longURL.

app.get("/u/:shortURL", (req, res) => {
  let tinyURL = accessURL(req.params.shortURL);
  res.redirect(tinyURL);
});

//User can delete own created shortURLs.

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.session.userID][req.params.id]
  res.redirect("/urls/");
});

//User can update URL, which then redirects to /urls.

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.session.userID][req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});

//Registration page for users to create a new account.

app.get("/register", (req, res) => {
  res.render("register");
});

//Checks if entered email already exists. If not, it adds the new user
//to the database, and sets a cookie.

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.status(400).send("Required e-mail and password!")
  }
    for(let id in users) {
      if(req.body.email === users[id].email) {
        return res.status(400).send("This email already exists!");
      }
    }
    let userID = generateRandomString();
    let userEmail = req.body.email;
    let userPass = req.body.password;
    users[userID] = {"id": userID, "email": userEmail, "password": bcrypt.hashSync(userPass, 10)};
    console.log(users);
    req.session.userID = userID
    res.redirect("/urls");
});

//Renders the Login page for returning users.

app.get("/login", (req, res) => {
  res.render("login");
});

//Checks if email and password entered are valid/match before setting
//the cookie.

app.post("/login", (req, res) => {
  const userIdMatch = findUserByEmail(req.body.email);
  if (!userIdMatch) {
    res.status(403).send("Email is invalid!")
  } else if (!hasUserPass(req.body.email, req.body.password)) {
    res.status(403).send("Password is invalid!")
  } else {
    req.session.userID = userIdMatch;
    res.redirect("/urls");
  }
});

//Logged-in users can logout. Cookie gets cleared.

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//********FUNCTIONS********//

function generateRandomString() {
  let RandomString = "";
   possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++)
    RandomString += possible.charAt(Math.floor(Math.random() * possible.length));

  return RandomString;
}

function hasUserPass(email, password) {
  for (let user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, users[user].password)) {
        return true;
      }
    }
  }
  return false;
}

function findUserByEmail(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id
    }
  }
}

function accessURL(URL) {
  for (let shortCode in urlDatabase) {
    if (urlDatabase[shortCode][URL]) {
      return (urlDatabase[shortCode][URL])
    }
  }
}