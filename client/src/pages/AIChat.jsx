import { useEffect, useState, useRef } from 'react';
import { repoService } from '../services/repoService';
import { aiService } from '../services/aiService';
import { toast } from 'sonner';
import { LuSend, LuLoader, LuBrain, LuUser, LuFolderGit2 } from 'react-icons/lu';

export default function AIChat() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    repoService.getAll().then(({ data }) => {
      setRepos(data);
      if (data.length) setSelectedRepo(data[0]._id);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !selectedRepo) return;
    const prompt = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const { data } = await aiService.chat(selectedRepo, prompt);
      setMessages((m) => [...m, { role: 'assistant', content: data.response }]);
    } catch {
      toast.error('Failed to get response');
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in relative max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Chat</h1>
          <p className="text-gray-400 text-sm mt-1">Ask questions about your codebase contextually</p>
        </div>
        <div className="flex items-center gap-3">
          <LuFolderGit2 className="text-gray-500" size={16} />
          <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-4 py-2 rounded-lg bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 appearance-none cursor-pointer hover:bg-surface-850 transition-colors pr-8 relative">
            {repos.map((r) => (
              <option key={r._id} value={r._id} className="bg-surface-800">{r.owner}/{r.repoName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 pb-32 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center mt-12">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
              <LuBrain className="text-3xl text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">How can I help you today?</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Select a repository above and ask about its architecture, find bugs, understand code patterns, or request specific improvements.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {['Explain the project architecture', 'What database is being used?', 'How does authentication work?', 'Suggest improvements'].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="p-4 rounded-xl card hover:bg-white/[0.04] text-left transition-colors group">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-primary-300 transition-colors">{q}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8 pb-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <LuBrain className="text-primary-400" size={14} />
                </div>
              )}
              
              <div className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-surface-800 text-gray-200 border border-white/5 rounded-tr-sm' 
                  : 'bg-transparent text-gray-300'
              }`}>
                <pre className="whitespace-pre-wrap font-sans font-medium">{msg.content}</pre>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <LuUser className="text-gray-400" size={14} />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <LuBrain className="text-primary-400 animate-pulse" size={14} />
              </div>
              <div className="px-5 py-4 text-[15px] text-gray-400">
                <div className="flex gap-1.5 items-center h-6">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pt-6 pb-2 bg-gradient-to-t from-surface-900 via-surface-900 to-transparent">
        <form onSubmit={handleSend} className="relative">
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder={selectedRepo ? "Ask about the codebase... (Press Enter to send)" : "Select a repository to start..."}
            disabled={!selectedRepo}
            rows={1}
            className="w-full pl-5 pr-14 py-4 rounded-xl card text-white placeholder-gray-500 text-[15px] focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-50 resize-none overflow-hidden shadow-2xl"
            style={{ minHeight: '56px', maxHeight: '200px' }}
          />
          <button type="submit" disabled={loading || !input.trim() || !selectedRepo}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-0 disabled:scale-95 transition-all">
            <LuSend size={18} />
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3 font-medium">DevMate AI can make mistakes. Consider verifying important information.</p>
      </div>
    </div>
  );
}
