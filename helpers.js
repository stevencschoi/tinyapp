// return object from user input
const getUserByEmail = (email, users) => {
  // loop through the users object
  for (const key of Object.keys(users)) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return false;
};

module.exports = {
  getUserByEmail
}