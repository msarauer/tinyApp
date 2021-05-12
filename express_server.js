const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

//set view engine
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]],
  };
  res.render("urls_index", templateVars);
});

//renders the form page to request a short url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
  };
  res.render("urls_new", templateVars);
});

//renders the registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
  };
  res.render("urls_register", templateVars);
});

//renders the login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
  };
  res.render("urls_login", templateVars);
});

//renders a page that shows the generated short URL and the corresponding long URL
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      user: users[req.cookies["userID"]],
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("The short URL you have entered does not exist.");
  }
});

//post request that logs the short-long URLs to the urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//redirects the user to the long URL from the shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(404).send("The short URL you have entered does not exist.");
  }
});

//post request to delete an item from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  urlDatabase[req.params.shortURL] = newURL;
  res.redirect("/urls");
});

//login (create a cookie)
app.post("/login", (req, res) => {
  const userID = emailLookup(req.body.email);
  if (userID === false) {
    return res.status(403).send("Email not found in system");
  }
  if (users[userID].password !== req.body.password) {
    return res.status(403).send("Password incorrect.");
  }
  res.cookie("userID", userID);
  res.redirect('/urls');
});

//logout (clear cookies)
app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

//register a new user and add them to the user object. Create a cookie of the new user's id
app.post("/register", (req, res) => {
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  if (newUserPassword === "" || newUserEmail === "") {
    return res.status(400).send("Email and Password cannot be blank.");
  }
  if (emailLookup(newUserEmail)) {
    return res.status(400).send("Email aready in use.");
  }
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: newUserEmail,
    password: newUserPassword
  };
  res.cookie("userID", userID);
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

//loops through the users object to see if the email already exists
const emailLookup = (email) => {
  for (const user in users) {
    if (users[user].email === email) return user;
  }
  return false;
};
