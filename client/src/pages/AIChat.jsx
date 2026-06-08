import { useEffect, useState, useRef } from 'react';
import { repoService } from '../services/repoService';
import { aiService } from '../services/aiService';
import { toast } from 'sonner';
import { LuSend, LuBrain, LuUser, LuFolderGit2, LuChevronDown } from 'react-icons/lu';

const SUGGESTIONS = [
  'Explain the project architecture',
  'How does authentication work?',
  'What database is being used?',
  'Suggest performance improvements',
];

export default function AIChat() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    repoService.getAll().then(({ data }) => {
      setRepos(data);
      if (data.length) setSelectedRepo(data[0]._id);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || !selectedRepo || loading) return;
    const prompt = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const { data } = await aiService.chat(selectedRepo, prompt);
      setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    } catch {
      toast.error('Failed to get response');
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '860px', margin: '0 auto', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', marginBottom: '0', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>AI Chat</h1>
          <p style={{ fontSize: '13px', color: '#475569' }}>Ask questions about your codebase contextually</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <LuFolderGit2 size={14} style={{ position: 'absolute', left: '12px', color: '#475569', pointerEvents: 'none' }} />
          <select
            value={selectedRepo}
            onChange={e => setSelectedRepo(e.target.value)}
            style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '13px',
              padding: '8px 36px 8px 32px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              fontFamily: 'inherit',
            }}
          >
            {repos.length === 0
              ? <option value="">No repositories</option>
              : repos.map(r => <option key={r._id} value={r._id}>{r.owner}/{r.repoName}</option>)
            }
          </select>
          <LuChevronDown size={12} style={{ position: 'absolute', right: '10px', color: '#475569', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <LuBrain size={26} style={{ color: '#818cf8' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>How can I help you today?</h3>
            <p style={{ fontSize: '13px', color: '#475569', maxWidth: '380px', lineHeight: '1.7', marginBottom: '28px' }}>
              Select a repository above, then ask about architecture, code patterns, bugs, or request improvements.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '560px' }}>
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 180ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#c4b5fd'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', maxWidth: '720px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            {/* Avatar */}
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${msg.role === 'user' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}` }}>
              {msg.role === 'user'
                ? <LuUser size={14} style={{ color: '#6ee7b7' }} />
                : <LuBrain size={14} style={{ color: '#818cf8' }} />
              }
            </div>
            {/* Bubble */}
            <div style={{
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: msg.role === 'user' ? '#16161f' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
              maxWidth: '100%',
            }}>
              <pre style={{ fontSize: '13px', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>
                {msg.content}
              </pre>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <LuBrain size={14} style={{ color: '#818cf8' }} />
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '4px 14px 14px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {[0, 150, 300].map(delay => (
                <span key={delay} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#475569', display: 'inline-block', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ flexShrink: 0, paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSend} style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedRepo ? 'Ask about the codebase… (Enter to send, Shift+Enter for newline)' : 'Select a repository first…'}
            disabled={!selectedRepo}
            rows={1}
            style={{
              width: '100%',
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '13px',
              padding: '14px 52px 14px 18px',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'none',
              minHeight: '52px',
              maxHeight: '160px',
              transition: 'border-color 180ms',
              opacity: !selectedRepo ? 0.5 : 1,
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !selectedRepo}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: (!input.trim() || loading) ? 'rgba(99,102,241,0.3)' : '#6366f1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              transition: 'background 180ms',
              color: '#fff',
            }}
          >
            <LuSend size={15} />
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '10px' }}>
          DevMate AI can make mistakes. Verify important information.
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
