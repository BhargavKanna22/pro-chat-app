import React, { useState, useEffect } from 'react';
import './Login.css';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Login = ({ setUser }) => {
  const [step, setStep] = useState('email'); // 'email' | 'new_user' | 'returning_user' | 'saved_profile'
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('prochat_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        setEmail(profile.email);
        setName(profile.name);
        setAvatar(profile.avatar);
        setStep('saved_profile');
      } catch (e) {
        localStorage.removeItem('prochat_profile');
      }
    }
  }, []);

  const handleAvatarSelect = (type) => {
    setAvatar(type);
    setName(type === 'boy' ? 'Jack' : 'Jenny');
  };

  const handleEmailCheck = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    try {
      const res = await fetch('https://pro-chat-app-k2jr.onrender.com/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep(data.exists ? 'returning_user' : 'new_user');
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (step === 'new_user' && (!avatar || !name || !password)) {
      setError('Please fill in all details.');
      return;
    }
    if ((step === 'returning_user' || step === 'saved_profile') && !password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const res = await fetch('https://pro-chat-app-k2jr.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, avatar })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('prochat_profile', JSON.stringify({ email, name: data.user.name, avatar: data.user.avatar }));
        setUser(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {step === 'email' && (
          <>
            <h2>Welcome to ProChat</h2>
            <p className="subtitle">Enter your email to continue</p>
            <form onSubmit={handleEmailCheck} className="login-form">
              <input 
                type="email" 
                placeholder="Your Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: '15px' }}
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit">Next</button>
            </form>
          </>
        )}

        {step === 'new_user' && (
          <>
            <h2>Create Profile</h2>
            <p className="subtitle">Pick an avatar and secure your account</p>
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
                placeholder="Choose a Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit">Complete Registration</button>
              <button type="button" style={{marginTop: '10px', background: 'transparent', color: '#888', border: '1px solid #444', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%'}} onClick={() => setStep('email')}>Back</button>
            </form>
          </>
        )}

        {step === 'returning_user' && (
          <>
            <h2>Welcome Back!</h2>
            <p className="subtitle">Enter your password to join the chat</p>
            <form onSubmit={handleLogin} className="login-form">
              <input 
                type="password" 
                placeholder="Your Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit">Log In</button>
              <button type="button" style={{marginTop: '10px', background: 'transparent', color: '#888', border: '1px solid #444', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%'}} onClick={() => setStep('email')}>Back</button>
            </form>
          </>
        )}

        {step === 'saved_profile' && (
          <>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px'}}>
              <img src={avatar === 'girl' ? girlAvatar : boyAvatar} alt="avatar" style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--message-received)', padding: '5px', marginBottom: '10px'}} />
              <h2>Welcome Back, {name}!</h2>
              <p className="subtitle" style={{marginBottom: 0}}>{email}</p>
            </div>
            <form onSubmit={handleLogin} className="login-form">
              <input 
                type="password" 
                placeholder="Your Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit">Log In</button>
              <button 
                type="button" 
                style={{marginTop: '10px', background: 'transparent', color: '#888', border: '1px solid #444', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%'}} 
                onClick={() => {
                  localStorage.removeItem('prochat_profile');
                  setEmail('');
                  setPassword('');
                  setStep('email');
                }}
              >
                Switch Account
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
