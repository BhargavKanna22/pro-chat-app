import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Trash2, X, Reply, ArrowLeft, Moon, Sun, Keyboard } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import boyAvatar from '../assets/boy.png';
import girlAvatar from '../assets/girl.png';

const ChatWindow = ({ activeContact, messages, user, sendMessage, clearChat, reactToMessage, setActiveContact, isDarkMode, toggleTheme }) => {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText, replyingTo ? replyingTo.content : null);
      setInputText('');
      setShowEmoji(false);
      setReplyingTo(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large! Limit is 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      sendMessage(event.target.result, replyingTo ? replyingTo.content : null);
      setReplyingTo(null);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const onEmojiClick = (emojiObject) => {
    setInputText(prev => prev + emojiObject.emoji);
  };

  const toggleEmojiPicker = (e) => {
    e.preventDefault();
    if (showEmoji) {
      setShowEmoji(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setShowEmoji(true);
      inputRef.current?.blur();
    }
  };

  if (!activeContact) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <p>Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  const getAvatar = (type) => type === 'girl' ? girlAvatar : boyAvatar;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <button className="mobile-back-btn icon-btn" onClick={() => setActiveContact(null)}>
            <ArrowLeft size={20} />
          </button>
          <img src={getAvatar(activeContact.avatar)} alt="avatar" className="user-avatar" />
          <div>
            <div className="contact-name" style={{fontSize: '1.1rem'}}>{activeContact.name}</div>
            <div className={`contact-status ${activeContact.isOnline ? 'online' : ''}`}>
              {activeContact.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark Mode" style={{padding: '8px'}}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="chat-actions icon-btn" onClick={clearChat} title="Clear Conversation">
            <Trash2 size={20} />
          </div>
        </div>
      </div>

      <div className="messages-list" style={{paddingBottom: '30px'}}>
        {messages.length === 0 ? (
           <div style={{
             flex: 1, 
             display: 'flex', 
             flexDirection: 'column',
             justifyContent: 'center', 
             alignItems: 'center', 
             textAlign: 'center',
             color: 'var(--text-secondary)'
           }}>
             <div style={{
               background: 'rgba(255, 255, 255, 0.9)', 
               padding: '20px 40px', 
               borderRadius: '15px', 
               boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
             }}>
               <h3 style={{color: 'var(--primary-color)', marginBottom: '10px'}}>Say Hello!😁</h3>
               <p>Your conversation with {activeContact.name} is a blank canvas.</p>
               <p style={{fontSize: '0.9rem', marginTop: '5px'}}>Send a message, an emoji, or a photo to start chatting.</p>
             </div>
           </div>
        ) : (
          messages.map((msg, index) => {
            const isSent = msg.sender_id === user.id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const isImage = msg.content.startsWith('data:image');

            return (
              <div 
                key={index} 
                className={`message ${isSent ? 'sent' : 'received'}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                style={{position: 'relative', marginBottom: msg.reaction ? '20px' : '10px'}}
              >
                {hoveredMessageId === msg.id && (
                  <div style={{
                    position: 'absolute', 
                    top: '-30px', 
                    [isSent ? 'right' : 'left']: '0',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '5px 10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    zIndex: 10
                  }}>
                    {quickReactions.map(r => (
                      <span 
                        key={r} 
                        style={{cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.1s'}} 
                        onClick={() => reactToMessage(msg.id, r)}
                        onMouseOver={e => e.target.style.transform = 'scale(1.2)'}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      >
                        {r}
                      </span>
                    ))}
                    <span 
                      style={{cursor: 'pointer', fontSize: '1.2rem', borderLeft: '1px solid #eee', paddingLeft: '5px', marginLeft: '2px'}} 
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                    >
                      ↩️
                    </span>
                  </div>
                )}

                {!isSent && <div style={{color: '#34b7f1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2px'}}>{activeContact.name}</div>}
                
                {msg.reply_to && (
                  <div style={{
                    background: 'rgba(0,0,0,0.08)', 
                    padding: '5px 10px', 
                    borderRadius: '5px', 
                    marginBottom: '5px', 
                    fontSize: '0.85rem',
                    borderLeft: `4px solid ${isSent ? 'white' : 'var(--primary-color)'}`,
                    opacity: 0.9
                  }}>
                    {msg.reply_to.startsWith('data:image') ? '📷 Photo' : msg.reply_to}
                  </div>
                )}

                {isImage ? (
                  <img src={msg.content} alt="shared" style={{maxWidth: '250px', borderRadius: '5px', marginTop: '5px', display: 'block'}} />
                ) : (
                  <div>{msg.content}</div>
                )}
                <div className="message-time">
                  {time}
                  {isSent && (
                    <span style={{ 
                      color: msg.status === 'read' ? '#53bdeb' : '#a0a0a0', 
                      fontSize: '0.7rem', 
                      marginLeft: '3px' 
                    }}>
                      ✓✓
                    </span>
                  )}
                </div>

                {msg.reaction && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-15px',
                    [isSent ? 'right' : 'left']: '10px',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '2px 6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    fontSize: '1rem',
                    zIndex: 5,
                    border: '1px solid #eee'
                  }}>
                    {msg.reaction}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area" style={{position: 'relative', flexDirection: 'column', alignItems: 'stretch'}}>
        {replyingTo && (
          <div style={{
            background: '#f0f2f5',
            padding: '10px 15px',
            borderRadius: '10px 10px 0 0',
            borderLeft: '4px solid var(--primary-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}>
            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '80%'}}>
              <span style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>Replying to {replyingTo.sender_id === user.id ? 'yourself' : activeContact.name}</span><br/>
              {replyingTo.content.startsWith('data:image') ? '📷 Photo' : replyingTo.content}
            </div>
            <button className="icon-btn" style={{padding: '0', fontSize: '0.8rem'}} onClick={() => setReplyingTo(null)}>❌</button>
          </div>
        )}
        <div style={{display: 'flex', alignItems: 'center', width: '100%', gap: '12px'}}>
          <button className="icon-btn" onClick={toggleEmojiPicker}>
            {showEmoji ? <Keyboard size={24} /> : <Smile size={24} />}
          </button>
          
          <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileUpload} accept="image/*" />
          <button className="icon-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={24} /></button>
          
          <form onSubmit={handleSend} className="chat-input-form" style={{flex: 1, display: 'flex'}}>
            <input 
              type="text" 
              ref={inputRef}
              placeholder="Type a message" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{width: '100%'}}
            />
          </form>
          {(inputText.trim() || showEmoji) && (
            <button className="icon-btn" style={{color: 'var(--primary-color)'}} onClick={handleSend}>
              <Send size={24} />
            </button>
          )}
        </div>
      </div>
      {showEmoji && (
        <div style={{ height: '300px', backgroundColor: 'var(--panel-bg)' }}>
          <EmojiPicker 
            onEmojiClick={onEmojiClick} 
            width="100%" 
            height="300px" 
            theme={isDarkMode ? 'dark' : 'light'} 
            searchDisabled={true}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
