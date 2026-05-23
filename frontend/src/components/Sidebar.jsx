import React, { useState } from 'react';
import { LogOut, Settings, Mail } from 'lucide-react';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Sidebar = ({ user, contacts, activeContact, setActiveContact, setUser, socket }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState(user.name);

  const handleLogout = () => {
    if (socket) socket.emit('logout');
    localStorage.removeItem('activePassword'); // We'll add this to Login
    setUser(null);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === user.name) {
      setShowSettings(false);
      return;
    }
    
    // Call API
    await fetch(`https://pro-chat-app-k2jr.onrender.com/api/users/${user.id}/name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    
    // Emit socket event to notify others
    if (socket) socket.emit('update_name', newName);
    
    // Update local state
    setUser({ ...user, name: newName });
    setShowSettings(false);
  };

  const handleDeleteChats = async () => {
    if (window.confirm('Are you sure you want to permanently delete ALL your chat history? This cannot be undone.')) {
      await fetch(`https://pro-chat-app-k2jr.onrender.com/api/users/${user.id}/chats`, {
        method: 'DELETE'
      });
      window.location.reload();
    }
  };

  const getAvatar = (type) => type === 'girl' ? girlAvatar : boyAvatar;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <img src={getAvatar(user.avatar)} alt="avatar" className="user-avatar" />
          <span style={{fontWeight: 600}}>{user.name}</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <button className="icon-btn" style={{marginRight: '10px'}} onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={20} />
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
            No other users registered.
          </div>
        ) : (
          contacts.map(contact => (
            <div 
              key={contact.id} 
              className={`contact-item ${activeContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => setActiveContact(contact)}
            >
              <img src={getAvatar(contact.avatar)} alt="avatar" className="user-avatar" />
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                <div className={`contact-status ${contact.isOnline ? 'online' : ''}`}>
                  {contact.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{marginBottom: '20px', textAlign: 'center'}}>
              <h3 style={{marginTop: 0, marginBottom: '5px'}}>Profile Settings</h3>
              <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                <Mail size={14} /> {user.email}
              </div>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Change Name</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}
              />
              <button 
                onClick={handleSaveName}
                style={{marginTop: '10px', background: 'var(--accent-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}
              >
                Save Name
              </button>
            </div>

            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ff4444'}}>Danger Zone</label>
              <button 
                onClick={handleDeleteChats}
                style={{width: '100%', background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '10px', borderRadius: '6px', cursor: 'pointer'}}
              >
                Delete All Chats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
