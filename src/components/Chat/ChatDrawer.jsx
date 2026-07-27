import { useState, useEffect, useRef } from 'react';
import { X, Send, User, ShieldCheck, Mic, Square, Volume2 } from 'lucide-react';
import { formatTime, getInitials } from '../../utils/helpers';
import './ChatDrawer.css';

const ChatDrawer = ({ isOpen, onClose, gigTitle, currentUserId, otherUser, messages = [], onSendMessage }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  // Clean up recording on unmount / close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          // Send audio message via onSendMessage
          onSendMessage('🎤 Voice Note', base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone access is required to record voice notes.');
    }
  };

  // Stop voice recording & send
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
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
              <span className="text-xs text-tertiary">Send a text or voice message to start conversation</span>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              const isVoice = msg.audioUrl || (typeof msg.text === 'string' && msg.text.startsWith('data:audio'));
              const audioSrc = msg.audioUrl || (isVoice ? msg.text : null);

              return (
                <div key={msg.id || index} className={`chat-message-row ${isMe ? 'me' : 'other'}`}>
                  <div className="chat-bubble">
                    <span className="sender-name">{msg.senderName || (isMe ? 'You' : otherUser?.name)}</span>
                    
                    {audioSrc ? (
                      <div className="voice-message-player-box mt-1 mb-1">
                        <div className="voice-tag">
                          <Volume2 size={14} className="inline-icon text-accent" /> Voice Note
                        </div>
                        <audio controls src={audioSrc} className="voice-audio-element" />
                      </div>
                    ) : (
                      <p className="message-text">{msg.text}</p>
                    )}

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
          {isRecording ? (
            <div className="recording-bar animate-fade-in">
              <span className="recording-dot blink"></span>
              <span className="recording-text">Recording Audio ({recordingSeconds}s)...</span>
              <button type="button" className="btn btn-error btn-sm stop-rec-btn" onClick={stopRecording}>
                <Square size={14} /> Send Voice Note
              </button>
            </div>
          ) : (
            <>
              <button 
                type="button" 
                className="mic-btn" 
                onClick={startRecording}
                title="Record Voice Message"
              >
                <Mic size={18} />
              </button>

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
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatDrawer;
