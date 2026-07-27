import { useState } from 'react';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, ShieldCheck, User, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTime, getInitials } from '../../utils/helpers';
import ChatDrawer from '../../components/Chat/ChatDrawer';
import './Chats.css';

const Chats = () => {
  const { gigs, sendChatMessage } = useGigs();
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null); // { gig, request }

  if (!user) {
    return (
      <div className="page-content">
        <div className="chats-guest animate-fade-in text-center p-6">
          <MessageSquare size={48} className="text-tertiary mb-4" />
          <h2>Direct In-App Chats</h2>
          <p className="text-secondary mt-2 mb-6">
            Log in to chat directly with publishers and applicant workers without sharing phone numbers.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg">Log In / Sign Up</Link>
        </div>
      </div>
    );
  }

  // Find all active conversations for the logged-in user
  const chatThreads = [];

  gigs.forEach(gig => {
    const isOwner = gig.postedBy === user.id;

    if (isOwner) {
      // Publisher sees chats with all applicants
      (gig.requests || []).forEach(req => {
        chatThreads.push({
          id: `${gig.id}_${req.id}`,
          gig,
          request: req,
          otherUser: { name: req.workerName },
          lastMessage: req.messages && req.messages.length > 0
            ? req.messages[req.messages.length - 1]
            : { text: req.message, timestamp: req.createdAt },
          isOwner: true,
        });
      });
    } else {
      // Worker sees chats with publishers of gigs they applied to
      const myReq = (gig.requests || []).find(r => r.workerId === user.id);
      if (myReq) {
        chatThreads.push({
          id: `${gig.id}_${myReq.id}`,
          gig,
          request: myReq,
          otherUser: { name: 'Publisher' },
          lastMessage: myReq.messages && myReq.messages.length > 0
            ? myReq.messages[myReq.messages.length - 1]
            : { text: myReq.message, timestamp: myReq.createdAt },
          isOwner: false,
        });
      }
    }
  });

  // Sort by last message timestamp
  chatThreads.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));

  const handleSendMessage = (text) => {
    if (!activeChat) return;
    sendChatMessage(activeChat.gig.id, activeChat.request.id, text);
  };

  // Keep active chat thread sync with latest state
  const currentActiveGig = activeChat ? gigs.find(g => g.id === activeChat.gig.id) : null;
  const currentActiveReq = currentActiveGig && activeChat 
    ? (currentActiveGig.requests || []).find(r => r.id === activeChat.request.id) || activeChat.request
    : null;

  return (
    <div className="page-content">
      <div className="chats-page">
        <header className="chats-header animate-fade-in">
          <h1>Direct Chats</h1>
          <p className="text-secondary text-sm">
            <Lock size={13} className="inline-icon text-success" /> Privacy-First In-App Messaging
          </p>
        </header>

        {chatThreads.length > 0 ? (
          <div className="chats-list stagger-children">
            {chatThreads.map(thread => (
              <div
                key={thread.id}
                className="chat-thread-card glass-card"
                onClick={() => setActiveChat(thread)}
              >
                <div className="avatar avatar-md">
                  {getInitials(thread.otherUser.name)}
                </div>

                <div className="chat-thread-info">
                  <div className="chat-thread-top">
                    <h3 className="thread-user-name">{thread.otherUser.name}</h3>
                    <span className="thread-time">{formatTime(thread.lastMessage.timestamp)}</span>
                  </div>
                  
                  <span className="thread-gig-title">📋 {thread.gig.title}</span>
                  <p className="thread-last-msg">
                    {thread.lastMessage.text.startsWith('data:audio') ? '🎤 Voice Note' : thread.lastMessage.text}
                  </p>
                </div>

                <div className="thread-arrow">
                  <ArrowRight size={16} className="text-tertiary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="chats-empty animate-fade-in-up">
            <div className="empty-icon">💬</div>
            <h3>No Active Conversations Yet</h3>
            <p className="text-secondary text-sm">
              When you post a requirement or apply for work, direct chats with workers or publishers will appear here.
            </p>
            <Link to="/explore" className="btn btn-primary mt-4">
              Explore Available Work
            </Link>
          </div>
        )}

        {/* Chat Drawer Component */}
        {currentActiveReq && activeChat && (
          <ChatDrawer
            isOpen={!!activeChat}
            onClose={() => setActiveChat(null)}
            gigTitle={activeChat.gig.title}
            currentUserId={user.id}
            otherUser={activeChat.otherUser}
            messages={currentActiveReq.messages || []}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default Chats;
