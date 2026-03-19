import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader, Sparkles } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useLocation } from 'react-router-dom';

const QUICK_PROMPTS = [
  'How do I write a rule for P1 incidents?',
  'What step types are available?',
  'Explain the DEFAULT rule',
  'How does rule priority work?',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your AI workflow assistant. Ask me about creating rules, understanding executions, or designing workflows.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { reply } = await aiAPI.chat(
        newMessages.filter(m => m.role !== 'system'),
        { page: location.pathname }
      );
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-widget">
      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--accent-purple)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>AI Assistant</span>
            </div>
            <button className="btn btn-ghost btn-xs" onClick={() => setOpen(false)} style={{ padding: '2px 6px' }}>
              <X size={13} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Loader size={12} className="spinner" style={{ animation: 'spin 0.7s linear infinite' }} />
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} className="btn btn-ghost btn-xs" onClick={() => send(p)} style={{ fontSize: 11 }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input-row">
            <input
              className="input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              style={{ fontSize: 13 }}
            />
            <button className="btn btn-primary btn-sm" onClick={() => send()} disabled={!input.trim() || loading}>
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      <button className="ai-chat-bubble" onClick={() => setOpen(o => !o)}>
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}
