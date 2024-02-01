// App.js
import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";

console.log("admin-portal/src/App.js route hit");

const App = () => {
	const [user, setUser] = useState(null);

	const handleLogin = (credentials) => {
		console.log("credentials: ", credentials);
		// Perform a fetch or use an HTTP library to send login credentials to the server
		fetch("/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(credentials),
			credentials: "include", // Include credentials (cookies) for cross-origin requests
		})
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				if (data.success) {
					setUser(data.user);
				} else {
					// Handle login failure
					console.error("Login failed");
					console.error("data: ", data);
				}
			})
			.catch((error) => {
				console.error("Error during login:", error);
			});
	};
  const handleLogout = () => {
    // Perform a fetch or use an HTTP library to send a logout request to the server
    fetch("/logout", {
      method: "GET",
      credentials: "include", // Include credentials (cookies) for cross-origin requests
    })
      .then((response) => {
        // Check if the response is a redirect
        if (response.redirected) {
          // Redirect to the login page
          window.location.href = response.url;
        } else {
          // If it's not a redirect, parse the JSON response
          return response.json();
        }
      })
      .then((data) => {
        if (data && data.success) {
          setUser(null);
        } else {
          // Handle logout failure
          console.error("Logout failed");
        }
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };
  

	return (
		<div>
			{user ? (
				// Render authenticated content
				<Dashboard user={user} onLogout={handleLogout} />
			) : (
				// Render login form if not authenticated
				<Login loginHandler={handleLogin} />
			)}
		</div>
	);
};

export default App;
