// Replace this with your real OAuth Client ID
const GOOGLE_CLIENT_ID = "628428485156-am6gqacvr5p1dm8nmhdioebdr2llid91.apps.googleusercontent.com"


hello.init({
  google: GOOGLE_CLIENT_ID
}, {
  redirect_uri: 'https://mknkbfeefkhemgomlblgipehaknlinjh.chromiumapp.org/',
  scope: 'email profile https://www.googleapis.com/auth/gmail.readonly'
});

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      hello('google').login({ scope: 'email' });
    });
  }

  // Listen for login events
  hello.on('auth.login', function(auth) {
    // Get profile after login
    hello(auth.network).api('me').then(function(user) {
      document.getElementById('profile').innerHTML = `
        <p>Hello, ${user.name}!</p>
        <img src="${user.thumbnail}" alt="Profile picture">
      `;
    });
  });
});

