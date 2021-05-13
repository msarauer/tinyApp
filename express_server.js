const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers.js');

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: ['Mitchel']
}))

//set view engine
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {longURL: "http://www.lighthouselabs.ca", userID: "user1"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2"}
};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

//app begins listening on the given port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//displays the urls database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//displays hello on the browser page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//renders the url database page
app.get("/urls", (req, res) => {
  if (!req.session.userID) {
    return res.status(400).send("Please login to view your short URLs.");
  }
  const templateVars = {
    urls: urlsForUser(req.session.userID),
    user: users[req.session.userID],
  };
  res.render("urls_index", templateVars);
});

//renders the form page to request a short url
app.get("/urls/new", (req, res) => {
  if (!req.session.userID) return res.redirect('/login');
  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_new", templateVars);
});

//renders the registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_register", templateVars);
});

//renders the login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_login", templateVars);
});

//renders a page that shows the generated short URL and the corresponding long URL
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userID],
    };
    return res.render("urls_show", templateVars);
  }
  return res.status(404).send("The short URL you have entered does not exist.");
});

//post request that logs the short-long URLs to the urlDatabase
app.post("/urls", (req, res) => {
  const longURLs = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURLs;
  urlDatabase[shortURL].userID = req.session.userID;
  res.redirect(`/urls/${shortURL}`);
});

//redirects the user to the long URL from the shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL].longURL;
    return res.redirect(longURL);
  }
  return res.status(404).send("The short URL you have entered does not exist.");
});

//post request to delete an item from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  for (const url in urlsForUser(req.session.userID)) {
    if (req.params.shortURL === url) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    }
  }
  return res.status(403).send("You do not have access to this url.");
});

//updates a shorturl with a new longurl
app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  for (const url in urlsForUser(req.session.userID)) {
    if (req.params.shortURL === url) {
      urlDatabase[req.params.shortURL].longURL = newURL;
       return res.redirect("/urls");
    }
  }
  return res.status(403).send("You do not have access to this url.");

});

//login (create a cookie)
app.post("/login", (req, res) => {
  const userID = getUserByEmail(req.body.email, users);
  if (userID === false) {
    return res.status(403).send("Email not found in system");
  }
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send("Password incorrect.");
  }
  req.session.userID = userID;
  res.redirect('/urls');
});

//logout (clear cookies)
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//register a new user and add them to the user object. Create a cookie of the new user's id
app.post("/register", (req, res) => {
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);
  if (newUserPassword === "" || newUserEmail === "") {
    return res.status(400).send("Email and Password cannot be blank.");
  }
  if (getUserByEmail(newUserEmail, users)) {
    return res.status(400).send("Email aready in use.");
  }
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: newUserEmail,
    password: hashedPassword
  };
  req.session.userID = userID;
  res.redirect('/urls');
});

//generates a random string for the shortURL
const generateRandomString = function () {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let answer = "";
  const len = 6;
  for (let i = 0; i < len; i++) {
    answer += chars[Math.floor(Math.random() * chars.length)];
  }
  return answer;
};



//returns a new object with only links related to the specific user
const urlsForUser = (id) => {
  let ownedUrls = {};
  const loggedInUser = id;
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === loggedInUser) {
      ownedUrls[url] = urlDatabase[url];
    }
  }
  return ownedUrls;
};
