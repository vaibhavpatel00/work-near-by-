import { useState, useEffect, useRef } from 'react';
import { X, Send, User, ShieldCheck } from 'lucide-react';
import { formatTime, getInitials } from '../../utils/helpers';
import './ChatDrawer.css';

const ChatDrawer = ({ isOpen, onClose, gigTitle, currentUserId, otherUser, messages = [], onSendMessage }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="chat-modal-overlay animate-fade-in">
      <div className="chat-modal-container animate-fade-in-up">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="avatar avatar-md">
              {getInitials(otherUser?.name || 'User')}
            </div>
            <div>
              <h3 className="chat-username">{otherUser?.name || 'User'}</h3>
              <p className="chat-subtitle">
                <ShieldCheck size={13} className="text-success inline-icon" /> Private Chat • {gigTitle}
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close Chat">
            <X size={20} />
          </button>
        </div>

        {/* Notice */}
        <div className="chat-privacy-notice">
          🔒 Private In-App Direct Chat. Phone number remains hidden until booking approval.
        </div>

        {/* Messages Body */}
        <div className="chat-messages-body">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <User size={36} className="text-tertiary mb-2" />
              <p>No messages yet.</p>
              <span className="text-xs text-tertiary">Send a message to start conversation</span>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id || index} className={`chat-message-row ${isMe ? 'me' : 'other'}`}>
                  <div className="chat-bubble">
                    <span className="sender-name">{msg.senderName || (isMe ? 'You' : otherUser?.name)}</span>
                    <p className="message-text">{msg.text}</p>
                    <span className="message-time">{formatTime(msg.timestamp || new Date().toISOString())}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form className="chat-footer" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="chat-send-btn" disabled={!text.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDrawer;
