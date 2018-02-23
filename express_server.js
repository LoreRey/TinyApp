const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

//********DATABASES********//

//data to show on the URLs page. To pass to template.
const urlDatabase = {
  "userRandomID": {
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK": "http://www.google.com"
  }
};

//users database
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

//********HANDLERS********//

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser())

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    userUrls: urlDatabase[req.cookies.userID],
    user: users[req.cookies.userID]
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.userID]
                     };
    if(users[req.cookies.userID]) {
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: users[req.cookies.userID]
                      };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
    if (!urlDatabase[req.cookies.userID]) {
      urlDatabase[req.cookies.userID] = {};
      urlDatabase[req.cookies.userID][shortURL] = req.body.longURL;
    } else {
      urlDatabase[req.cookies.userID][shortURL] = req.body.longURL;
    }
    console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  //console.log(urlDatabase)
  let tinyURL = accessURL(req.params.shortURL);
  res.redirect(tinyURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.cookies.userID][req.params.id]
  res.redirect("/urls/");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.cookies.userID][req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

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
    let userPass = req.body.password
  users[userID] = {"id": userID, "email": userEmail, "password": userPass};
  console.log(users);
  res.cookie('userID', userID)
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  //res.cookie('username', req.body.username)
  //console.log(req.body.username)
  let userIdMatch = findUserByEmail(req.body.email);
  if (!userIdMatch) {
    res.status(403).send("Email is invalid!")
  } else if (!hasUserPass(req.body.email, req.body.password)) {
    res.status(403).send("Password is invalid!")
  } else {
    res.cookie('userID', userIdMatch);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  //res.clearCookie('username');
  res.clearCookie('userID');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//********FUNCTIONS********//

function generateRandomString() {
  let RandomString = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++)
    RandomString += possible.charAt(Math.floor(Math.random() * possible.length));

  return RandomString;
}

function hasUserPass(email, password) {
  for (let user in users) {
    if (users[user].email === email) {
      if (users[user].password === password) {
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