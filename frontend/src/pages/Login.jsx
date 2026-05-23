import React, { useState } from 'react';
import './Login.css';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Login = ({ setUser }) => {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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
      if (!isRegistering) {
        // Step 1: Check if user exists
        const checkRes = await fetch('https://pro-chat-app-k2jr.onrender.com/api/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, avatar })
        });
        const checkData = await checkRes.json();
        
        if (checkRes.ok && !checkData.exists) {
          setIsRegistering(true);
          setError('');
          return;
        }
      }

      // Step 2: Login or Complete Registration
      if (isRegistering && !email) {
        setError('Please enter an email for offline notifications.');
        return;
      }

      const res = await fetch('https://pro-chat-app-k2jr.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, avatar, email: isRegistering ? email : undefined })
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
        <h2>{isRegistering ? "Complete Registration" : "Welcome to ProChat"}</h2>
        <p className="subtitle">{isRegistering ? "Add an email to get offline alerts" : "Select your avatar to begin"}</p>
        
        {!isRegistering && (
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
        )}

        <form onSubmit={handleLogin} className="login-form">
          {!isRegistering && (
            <>
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
            </>
          )}

          {isRegistering && (
            <input 
              type="email" 
              placeholder="Your Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: '15px' }}
            />
          )}

          {error && <div className="error-message">{error}</div>}
          <button type="submit">{isRegistering ? "Complete Registration" : "Enter Chat"}</button>
          
          {isRegistering && (
            <button 
              type="button" 
              style={{marginTop: '10px', background: 'transparent', color: '#888', border: '1px solid #444', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%'}} 
              onClick={() => setIsRegistering(false)}
            >
              Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
