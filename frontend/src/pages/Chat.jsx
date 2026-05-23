import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import './Chat.css';

const BACKEND_URL = 'https://pro-chat-app-k2jr.onrender.com';
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});

const Chat = ({ user, setUser }) => {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('chat-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('chat-theme', 'light');
      }
      return newTheme;
    });
  };

  useEffect(() => {
    // Tell server we are logged in
    socket.emit('user_login', user.id);

    // Fetch initial users
    fetch(`${BACKEND_URL}/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setContacts(data);
      });

    // Listen for status changes
    socket.on('user_status_change', (updatedUser) => {
      if (updatedUser.id === user.id) return;
      setContacts(prev => {
        const exists = prev.find(c => c.id === updatedUser.id);
        if (exists) {
          return prev.map(c => c.id === updatedUser.id ? updatedUser : c);
        } else {
          return [...prev, updatedUser];
        }
      });
    });

    // Listen for new messages
    socket.on('receive_message', (message) => {
      // Add message to current view if it belongs to the active conversation
      if (
        (message.sender_id === user.id && message.receiver_id === activeContact?.id) ||
        (message.sender_id === activeContact?.id && message.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, message]);
        if (message.sender_id === activeContact?.id) {
          socket.emit('mark_read', { sender_id: activeContact.id, receiver_id: user.id });
        }
      }
    });

    // Listen for chat cleared
    socket.on('chat_cleared', ({ sender_id, receiver_id }) => {
      if (
        (receiver_id === user.id && activeContact && sender_id === activeContact.id) ||
        (sender_id === user.id && activeContact && receiver_id === activeContact.id)
      ) {
        setMessages([]);
      }
    });

    // Listen for reactions
    socket.on('message_reacted', ({ messageId, reaction }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reaction } : msg
      ));
    });

    // Listen for read receipts
    socket.on('messages_read', ({ sender_id, receiver_id }) => {
      if (sender_id === user.id && receiver_id === activeContact?.id) {
        setMessages(prev => prev.map(msg => 
          (msg.sender_id === user.id && msg.status === 'sent') ? { ...msg, status: 'read' } : msg
        ));
      }
    });

    return () => {
      socket.off('user_status_change');
      socket.off('receive_message');
      socket.off('chat_cleared');
      socket.off('message_reacted');
      socket.off('messages_read');
    };
  }, [user.id, activeContact]);

  useEffect(() => {
    if (activeContact) {
      fetch(`${BACKEND_URL}/api/messages/${user.id}/${activeContact.id}`)
        .then(res => res.json())
        .then(data => setMessages(data));
    }
  }, [activeContact, user.id]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (activeContact) {
      socket.emit('mark_read', { sender_id: activeContact.id, receiver_id: user.id });
    }
  }, [activeContact]);

  useEffect(() => {
    if (contacts.length === 1 && !activeContact) {
      setActiveContact(contacts[0]);
    } else if (contacts.length > 0 && activeContact) {
      // Keep active contact updated with latest status/name
      const updatedContact = contacts.find(c => c.id === activeContact.id);
      if (updatedContact && (
        updatedContact.name !== activeContact.name || 
        updatedContact.isOnline !== activeContact.isOnline || 
        updatedContact.avatar !== activeContact.avatar
      )) {
        setActiveContact(updatedContact);
      }
    }
  }, [contacts, activeContact]);

  const sendMessage = (content, replyTo = null) => {
    if (!activeContact || !content.trim()) return;
    
    const messageData = {
      sender_id: user.id,
      receiver_id: activeContact.id,
      content,
      reply_to: replyTo
    };
    
    socket.emit('send_message', messageData);
  };

  const clearChat = () => {
    if (!activeContact) return;
    
    if (window.confirm(`Are you sure you want to permanently delete your conversation with ${activeContact.name}? This cannot be undone.`)) {
      fetch(`${BACKEND_URL}/api/messages/${user.id}/${activeContact.id}`, {
        method: 'DELETE'
      }).then(() => {
        socket.emit('clear_chat', { sender_id: user.id, receiver_id: activeContact.id });
        setMessages([]);
      });
    }
  };

  const reactToMessage = (messageId, reaction) => {
    socket.emit('react_message', { messageId, reaction });
  };

  return (
    <div className={`chat-layout ${activeContact ? 'has-active-contact' : ''}`}>
      <Sidebar 
        user={user} 
        contacts={contacts} 
        activeContact={activeContact}
        setActiveContact={setActiveContact}
        setUser={setUser}
        socket={socket}
      />
      <ChatWindow 
        activeContact={activeContact} 
        messages={messages} 
        user={user}
        sendMessage={sendMessage}
        clearChat={clearChat}
        reactToMessage={reactToMessage}
        setActiveContact={setActiveContact}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    </div>
  );
};

export default Chat;
