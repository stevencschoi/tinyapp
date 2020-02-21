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
  generateRandomString,
  getUserByEmail,
}