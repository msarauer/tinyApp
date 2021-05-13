//loops through the users object to see if the email already exists
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) return user;
  }
  return false;
};

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
const urlsForUser = (id, database) => {
  let ownedUrls = {};
  const loggedInUser = id;
  for (const url in database) {
    if (database[url]["userID"] === loggedInUser) {
      ownedUrls[url] = database[url];
    }
  }
  return ownedUrls;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
};
