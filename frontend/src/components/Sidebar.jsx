import React, { useState } from 'react';
import { LogOut, Settings, Mail } from 'lucide-react';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const Sidebar = ({ user, contacts, hiddenContacts = [], setHiddenContacts, activeContact, setActiveContact, setUser, socket }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (selectedToDelete.length === 0) {
      alert("Please select at least one chat to delete.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete ${selectedToDelete.length} selected chat(s)? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        for (const contactId of selectedToDelete) {
          await fetch(`https://pro-chat-app-k2jr.onrender.com/api/messages/${user.id}/${contactId}`, {
            method: 'DELETE'
          });
          if (socket) {
            socket.emit('clear_chat', { sender_id: user.id, receiver_id: contactId });
          }
        }
        
        // If the currently active chat was deleted, close it
        if (activeContact && selectedToDelete.includes(activeContact.id)) {
          setActiveContact(null);
        }
        
        setShowSettings(false);
        setSelectedToDelete([]);
      } catch (err) {
        console.error("Error deleting chats:", err);
        alert("There was an error deleting the chats. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleSelectDelete = (contactId) => {
    setSelectedToDelete(prev => 
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleHideContact = (contactId) => {
    setHiddenContacts(prev => {
      const newHidden = prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId];
      localStorage.setItem('hiddenContacts', JSON.stringify(newHidden));
      return newHidden;
    });
    if (activeContact && activeContact.id === contactId && !hiddenContacts.includes(contactId)) {
      setActiveContact(null);
    }
  };

  const getAvatar = (type) => type === 'girl' ? girlAvatar : boyAvatar;

  const visibleContacts = contacts.filter(c => !hiddenContacts.includes(c.id));

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
        {visibleContacts.length === 0 ? (
          <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
            Sorry u Have no Frnds 🥲
          </div>
        ) : (
          visibleContacts.map(contact => (
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
              <div style={{textAlign: 'right'}}>
                <button 
                  onClick={handleSaveName}
                  style={{marginTop: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px'}}>
              <label style={{display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Manage Visibility (Hide Contacts)</label>
              
              {contacts.length === 0 ? (
                <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No contacts available.</div>
              ) : (
                <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '10px', background: 'var(--bg-color)', borderRadius: '6px', padding: '5px'}}>
                  {contacts.map(contact => (
                    <label key={contact.id} style={{display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}}>
                      <input 
                        type="checkbox" 
                        checked={hiddenContacts.includes(contact.id)}
                        onChange={() => toggleHideContact(contact.id)}
                        style={{marginRight: '10px'}}
                      />
                      <img src={getAvatar(contact.avatar)} alt="avatar" style={{width: '24px', height: '24px', borderRadius: '50%', marginRight: '10px'}} />
                      <span style={{fontSize: '0.9rem'}}>{contact.name}</span>
                      <span style={{marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{hiddenContacts.includes(contact.id) ? 'Hidden' : 'Visible'}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px'}}>
              <label style={{display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: '#ff4444'}}>Danger Zone: Delete Chats</label>
              
              {contacts.length === 0 ? (
                <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No chats to delete.</div>
              ) : (
                <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '10px', background: 'var(--bg-color)', borderRadius: '6px', padding: '5px'}}>
                  {contacts.map(contact => (
                    <label key={contact.id} style={{display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}}>
                      <input 
                        type="checkbox" 
                        checked={selectedToDelete.includes(contact.id)}
                        onChange={() => toggleSelectDelete(contact.id)}
                        style={{marginRight: '10px'}}
                      />
                      <img src={getAvatar(contact.avatar)} alt="avatar" style={{width: '24px', height: '24px', borderRadius: '50%', marginRight: '10px'}} />
                      <span style={{fontSize: '0.9rem'}}>{contact.name}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {contacts.length > 0 && (
                <button 
                  onClick={handleDeleteChats}
                  disabled={isDeleting || selectedToDelete.length === 0}
                  style={{width: '100%', background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '10px', borderRadius: '6px', cursor: (isDeleting || selectedToDelete.length === 0) ? 'not-allowed' : 'pointer', opacity: (isDeleting || selectedToDelete.length === 0) ? 0.5 : 1}}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected Chats'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
