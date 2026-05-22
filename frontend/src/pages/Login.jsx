import React, { useState } from 'react';
import './Login.css';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Login = ({ setUser }) => {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAvatarSelect = (type) => {
    setAvatar(type);
    setName(type === 'boy' ? 'Jack' : 'Jenny');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!avatar) {
      setError('Please select an avatar.');
      return;
    }
    if (!name || !password) {
      setError('Please enter name and password.');
      return;
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, avatar })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server. Ensure backend is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome to ProChat</h2>
        <p className="subtitle">Select your avatar to begin</p>
        
        <div className="avatar-selection">
          <div 
            className={`avatar-option ${avatar === 'boy' ? 'selected' : ''}`}
            onClick={() => handleAvatarSelect('boy')}
          >
            <img src={boyAvatar} alt="Boy Avatar" />
          </div>
          <div 
            className={`avatar-option ${avatar === 'girl' ? 'selected' : ''}`}
            onClick={() => handleAvatarSelect('girl')}
          >
            <img src={girlAvatar} alt="Girl Avatar" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="text" 
            placeholder="Your Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Enter Chat</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
