import { useEffect, useState, useRef } from 'react';
import { repoService } from '../services/repoService';
import { aiService } from '../services/aiService';
import { toast } from 'sonner';
import { LuSend, LuBrain, LuUser, LuFolderGit2, LuChevronDown, LuCircleAlert } from 'react-icons/lu';

const SUGGESTIONS = [
  'Explain the project architecture',
  'How does authentication work?',
  'Walk me through the request lifecycle',
  'Explain the database design',
  'What patterns does this codebase use?',
  'Interview questions for this project',
];

const MODE_CONFIG = {
  flow:         { label: 'Flow',         color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  interview:    { label: 'Interview',    color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  architecture: { label: 'Architecture', color: '#93c5fd', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  general:      { label: 'General',      color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
};

function ConfidenceBar({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? '#6ee7b7' : pct >= 60 ? '#fcd34d' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
      <span style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Confidence</span>
      <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 600ms ease' }} />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: '700', minWidth: '28px' }}>{pct}%</span>
    </div>
  );
}

export default function AIChat() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const lastSourcesRef = useRef([]);   // sources from last AI response
  const currentTopicRef = useRef('');  // topic memory across turns

  useEffect(() => {
    repoService.getAll().then(({ data }) => {
      setRepos(data);
      if (data.length) setSelectedRepo(data[0]._id);
    });
  }, []);

  // Clear conversation when repo changes
  useEffect(() => {
    setMessages([]);
    lastSourcesRef.current  = [];
    currentTopicRef.current = '';
  }, [selectedRepo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

    // Snapshot before state update
    const historyForRequest = messages.map(m => ({ role: m.role, content: m.content }));
    const previousSources   = lastSourcesRef.current;
    const currentTopic      = currentTopicRef.current;

    setMessages(m => [...m, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const { data } = await aiService.chat(selectedRepo, prompt, historyForRequest, previousSources, currentTopic);
      const r = data.response;

      const answer          = r?.answer          ?? r ?? 'No response received.';
      const sources         = Array.isArray(r?.sources) ? r.sources : [];
      const confidence      = typeof r?.confidence === 'number' ? r.confidence : null;
      const mode            = r?.mode   || 'general';
      const topic           = r?.topic  || currentTopic;
      const needsMoreCtx    = r?.needsMoreContext || false;
      const missingFiles    = r?.missingFiles     || [];

      // Persist for next turn
      lastSourcesRef.current  = sources.filter(Boolean);
      currentTopicRef.current = topic;

      setMessages(m => [...m, {
        role: 'assistant',
        content: String(answer),
        sources, confidence, mode, topic, needsMoreCtx, missingFiles,
      }]);
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

  const currentTopic = currentTopicRef.current;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '860px', margin: '0 auto', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>AI Chat</h1>
            {currentTopic && (
              <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentTopic}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Ask questions about your codebase with contextual memory</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <LuFolderGit2 size={14} style={{ position: 'absolute', left: '12px', color: '#475569', pointerEvents: 'none' }} />
          <select
            value={selectedRepo}
            onChange={e => setSelectedRepo(e.target.value)}
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', padding: '8px 36px 8px 32px', outline: 'none', cursor: 'pointer', appearance: 'none', fontFamily: 'inherit' }}
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
            <p style={{ fontSize: '13px', color: '#475569', maxWidth: '400px', lineHeight: '1.7', marginBottom: '28px' }}>
              Ask about architecture, flows, database design, or request interview prep — I maintain context across follow-ups.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '600px' }}>
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  style={{ padding: '12px 16px', textAlign: 'left', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer', transition: 'all 180ms', fontFamily: 'inherit' }}
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
              {msg.role === 'user' ? <LuUser size={14} style={{ color: '#6ee7b7' }} /> : <LuBrain size={14} style={{ color: '#818cf8' }} />}
            </div>

            {/* Bubble */}
            <div style={{ padding: '12px 16px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.role === 'user' ? '#16161f' : 'rgba(255,255,255,0.03)', border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`, maxWidth: '100%' }}>

              {/* Mode + Topic pills (assistant only) */}
              {msg.role === 'assistant' && (msg.mode || msg.topic) && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {msg.mode && msg.mode !== 'general' && (() => {
                    const cfg = MODE_CONFIG[msg.mode] || MODE_CONFIG.general;
                    return (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                  {msg.topic && (
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px', background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {msg.topic}
                    </span>
                  )}
                </div>
              )}

              <pre style={{ fontSize: '13px', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>
                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
              </pre>

              {/* Missing context warning */}
              {msg.needsMoreCtx && msg.missingFiles?.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <LuCircleAlert size={14} style={{ color: '#fcd34d', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#fcd34d', margin: '0 0 4px' }}>Incomplete Context</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      Some relevant files may not be in cache: {msg.missingFiles.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Confidence bar */}
              {msg.role === 'assistant' && typeof msg.confidence === 'number' && (
                <ConfidenceBar value={msg.confidence} />
              )}

              {/* Source citations */}
              {msg.sources?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sources</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {msg.sources.filter(Boolean).map((src, j) => (
                      <span key={j} style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '4px', padding: '2px 8px', fontFamily: 'monospace' }}>
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
            style={{ width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', color: '#f1f5f9', fontSize: '13px', padding: '14px 52px 14px 18px', outline: 'none', fontFamily: 'inherit', lineHeight: '1.6', resize: 'none', minHeight: '52px', maxHeight: '160px', transition: 'border-color 180ms', opacity: !selectedRepo ? 0.5 : 1 }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !selectedRepo}
            style={{ position: 'absolute', right: '10px', bottom: '10px', width: '32px', height: '32px', borderRadius: '8px', background: (!input.trim() || loading) ? 'rgba(99,102,241,0.3)' : '#6366f1', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer', transition: 'background 180ms', color: '#fff' }}
          >
            <LuSend size={15} />
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '10px' }}>
          DevMate AI — evidence-based answers from your actual source code
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
