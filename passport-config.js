// passport-config.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

console.log('passport-config.js route hit');

const users = [
  { id: 1, username: 'admin', password: 'password' } // Replace with actual user data
];
passport.use(
  new LocalStrategy(async function verify(username, password, done) {
    try {
      console.log('Received username:', username);
      console.log('Received password:', password);

      const user = users.find(user => user.username === username);

      if (!user || user.password !== password) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(user => user.id === id);
  done(null, user);
});

module.exports = passport;