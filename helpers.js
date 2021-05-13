//loops through the users object to see if the email already exists
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) return user;
  }
  return false;
};

module.exports = {
  getUserByEmail
}