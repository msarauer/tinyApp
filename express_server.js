const express = require("express");
const app = express();
const PORT = 8080; //default port 8080
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers.js");

//set view engine
app.set("view engine", "ejs");

//app begins listening on the given port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//******* MIDDLEWARE *******//

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(methodOverride('_method'));
app.use(
  cookieSession({
    name: "session",
    keys: ["Mitchel"],
  })
);

//******* VARIABLES *******//

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user1" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2" },
};

const users = {};

//******* ROUTES *******//

//redirects to the login page if not logged in or the url page if someone is logged in
app.get("/", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

//displays the urls database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//renders the url database page if logged in.
app.get("/urls", (req, res) => {
  if (!req.session.userID) {
    return res.status(400).send("Please login to view your short URLs.");
  }
  const templateVars = {
    urls: urlsForUser(req.session.userID, urlDatabase),
    user: users[req.session.userID],
  };
  res.render("urls_index", templateVars);
});

//renders the form page to request a shortURL. If not logged in, send to the login page.
app.get("/urls/new", (req, res) => {
  if (!req.session.userID) return res.redirect("/login");
  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_new", templateVars);
});

//renders the registration page. If already logged in, send user to /urls
app.get("/register", (req, res) => {
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session.userID],
  };
  return res.render("urls_register", templateVars);
});

//renders the login page. If already logged in, send user to /urls
app.get("/login", (req, res) => {
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session.userID],
  };
  return res.render("urls_login", templateVars);
});

//renders a page that shows the generated shortURL and the corresponding longURL if they are the creator,
//and if a shortURL exists
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    for (const url in urlsForUser(req.session.userID, urlDatabase)) {
      if (req.params.shortURL === url) {
        const templateVars = {
          shortURL: req.params.shortURL,
          longURL: urlDatabase[req.params.shortURL].longURL,
          user: users[req.session.userID],
        };
        return res.render("urls_show", templateVars);
      }
    }
    return res.status(403).send("You do not have access to this tiny url.");
  }
  return res.status(404).send("The short URL you have entered does not exist.");
});

//redirects the user to the long URL from the shortURL if it exists
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL].longURL;
    return res.redirect(longURL);
  }
  return res.status(404).send("The short URL you have entered does not exist.");
});

//post request that logs the short/long URLs to the urlDatabase if a user is logged in
app.post("/urls", (req, res) => {
  if (req.session.userID) {
    const longURLs = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = longURLs;
    urlDatabase[shortURL].userID = req.session.userID;
    return res.redirect(`/urls/${shortURL}`);
  }
  return res.status(403).send("You must be logged in to perform this action.");
});

//post request to delete an item from the database if the logged in used is the creator of the shortURL
app.delete("/urls/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  for (const url in urlsForUser(req.session.userID, urlDatabase)) {
    if (req.params.shortURL === url) {
      delete urlDatabase[req.params.shortURL];
      return res.redirect("/urls");
    }
  }
  return res.status(403).send("You do not have access to this url.");
});

//updates a shortURL with a new longURL if the logged in used is the creator of the shortURL
app.put("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  for (const url in urlsForUser(req.session.userID, urlDatabase)) {
    if (req.params.shortURL === url) {
      urlDatabase[req.params.shortURL].longURL = newURL;
      return res.redirect("/urls");
    }
  }
  return res.status(403).send("You do not have access to this url.");
});

//Checks to see if the user is in the system, compares with password hash stored, 
//creates a cookie, sends user to /urls
app.post("/login", (req, res) => {
  const userID = getUserByEmail(req.body.email, users);
  if (userID === false) {
    return res.status(403).send("Email not found in system");
  }
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send("Password incorrect.");
  }
  req.session.userID = userID;
  res.redirect("/urls");
});

//logout (clears cookies), sends user to /urls
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
    password: hashedPassword,
  };
  req.session.userID = userID;
  res.redirect("/urls");
});


