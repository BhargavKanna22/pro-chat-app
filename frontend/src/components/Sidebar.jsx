import React from 'react';
import { LogOut, Settings, Mail } from 'lucide-react';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Sidebar = ({ user, contacts, activeContact, setActiveContact, setUser, socket }) => {
  const handleLogout = () => {
    if (socket) socket.emit('logout');
    localStorage.removeItem('activePassword'); // We'll add this to Login
    setUser(null);
  };

  const getAvatar = (type) => type === 'girl' ? girlAvatar : boyAvatar;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <img src={getAvatar(user.avatar)} alt="avatar" className="user-avatar" />
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontWeight: 600}}>{user.name}</span>
            <span style={{fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <Mail size={12} /> {user.email || 'No email'}
            </span>
          </div>
        </div>
        <div>
          <button className="icon-btn" style={{marginRight: '10px'}}><Settings size={20} /></button>
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
    </div>
  );
};

export default Sidebar;
