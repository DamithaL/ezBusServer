// Login.js
import React, { useState } from 'react';

const Login = ({ loginHandler }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    try {
      console.log(`handleLogin: ${username}, ${password}`);
      // Call loginHandler with credentials
      loginHandler({ username, password });
    } catch (error) {
      console.error('Error in loginHandler:', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
