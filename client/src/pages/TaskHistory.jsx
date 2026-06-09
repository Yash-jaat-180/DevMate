import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { toast } from 'sonner';
import { LuHistory, LuTrash2, LuBrain, LuWandSparkles, LuMessageSquare, LuLightbulb, LuClock, LuExternalLink, LuLoader } from 'react-icons/lu';
import { useRef } from 'react';

const CARD = { background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' };

const typeConfig = {
  analysis:             { label: 'Analysis',    bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd', border: 'rgba(59,130,246,0.25)',  icon: LuBrain },
  chat:                 { label: 'Chat',         bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: 'rgba(139,92,246,0.25)',  icon: LuMessageSquare },
  suggestions:          { label: 'Suggestions',  bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: 'rgba(245,158,11,0.25)',  icon: LuLightbulb },
  'feature-generation': { label: 'Feature Gen',  bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)', icon: LuWandSparkles },
};

export default function TaskHistory() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadTasks(); }, [filter]);

  async function loadTasks() {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter) params.taskType = filter;
      const { data } = await taskService.getAll(params);
      setTasks(data.tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }

  async function viewTask(id) {
    setDetailLoading(true);
    try {
      const { data } = await taskService.getById(id);
      setSelected(data);
    } catch { toast.error('Failed to load task'); }
    finally { setDetailLoading(false); }
  }

  async function deleteTask(id) {
    try {
      await taskService.delete(id);
      toast.success('Task deleted');
      setTasks(t => t.filter(x => x._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { toast.error('Failed to delete task'); }
  }

  const filters = ['', 'analysis', 'chat', 'suggestions', 'feature-generation'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '0' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Task History</h1>
          <p style={{ fontSize: '13px', color: '#475569' }}>Review your past AI interactions</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 180ms',
                background: filter === f ? 'rgba(99,102,241,0.15)' : '#111118',
                color: filter === f ? '#818cf8' : '#475569',
                borderColor: filter === f ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {f ? typeConfig[f]?.label : 'All Tasks'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>

        {/* Task List */}
        <div className="custom-scrollbar" style={{ width: '340px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px' }}>
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '10px' }} />)
          ) : tasks.length === 0 ? (
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <LuHistory size={18} style={{ color: '#818cf8' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', marginBottom: '4px' }}>No tasks found</p>
              <p style={{ fontSize: '12px', color: '#334155' }}>Your AI interactions will appear here</p>
            </div>
          ) : (
            tasks.map(task => {
              const cfg = typeConfig[task.taskType] || typeConfig.chat;
              const isSelected = selected?._id === task._id;
              return (
                <button
                  key={task._id}
                  onClick={() => viewTask(task._id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: isSelected ? '#16161f' : '#111118',
                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 180ms',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); deleteTask(task._id); }}
                      onKeyDown={e => e.key === 'Enter' && deleteTask(task._id)}
                      style={{ padding: '3px', color: '#334155', cursor: 'pointer', borderRadius: '4px', lineHeight: 0, transition: 'color 180ms', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                    >
                      <LuTrash2 size={13} />
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                    {task.prompt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuClock size={10} />{new Date(task.createdAt).toLocaleDateString()}</span>
                    {task.repositoryId && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {task.repositoryId.repoName}</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Task Detail */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
          <div style={{ ...CARD, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {detailLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '48px' }}>
                <LuLoader size={24} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '13px', color: '#475569' }}>Loading task…</p>
              </div>
            ) : selected ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0' }}>
                {/* Detail header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {(() => { const cfg = typeConfig[selected.taskType] || typeConfig.chat; return (
                      <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    ); })()}
                    <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <LuClock size={10} />{new Date(selected.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selected.repositoryId && (
                    <Link
                      to={`/repositories/${selected.repositoryId._id || selected.repositoryId}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#818cf8', textDecoration: 'none', padding: '6px 12px', borderRadius: '7px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                      View Repo <LuExternalLink size={11} />
                    </Link>
                  )}
                </div>

                {/* Prompt */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Prompt</p>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px 16px' }}>
                    <p style={{ fontSize: '14px', color: '#f1f5f9', lineHeight: '1.6' }}>{selected.prompt}</p>
                  </div>
                </div>

                {/* Response */}
                <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px 24px 12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Response</p>
                  </div>
                  
                  <div className="custom-scrollbar" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
                    {(() => {
                      const { taskType, response } = selected;
                      if (!response) return <p style={{ color: '#475569', fontSize: '13px' }}>No response data.</p>;

                      if (typeof response === 'string') {
                        return (
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px 18px' }}>
                            <pre style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>{response}</pre>
                          </div>
                        );
                      }

                      if (taskType === 'chat') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px 18px' }}>
                              <pre style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>{response.answer || 'No answer'}</pre>
                            </div>
                            {response.sources && response.sources.length > 0 && (
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Sources</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {response.sources.filter(Boolean).map((src, i) => (
                                    <span key={i} style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '4px', padding: '3px 8px', fontFamily: 'monospace' }}>
                                      {src}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (taskType === 'analysis') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(response).map(([key, value]) => (
                              <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px 18px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px', textTransform: 'capitalize', margin: '0 0 8px 0' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                {typeof value === 'string' ? (
                                  <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{value}</p>
                                ) : Array.isArray(value) ? (
                                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {value.map((item, i) => <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}
                                  </ul>
                                ) : (
                                  <pre style={{ fontSize: '12px', color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (taskType === 'suggestions') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {Object.entries(response).map(([category, items]) => {
                              if (!Array.isArray(items) || items.length === 0) return null;
                              return (
                                <div key={category}>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '12px', textTransform: 'capitalize', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: '0 0 12px 0' }}>{category}</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {items.map((item, i) => (
                                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>{item.title}</p>
                                          {item.priority && (
                                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.priority}</span>
                                          )}
                                        </div>
                                        {item.file && <p style={{ fontSize: '12px', color: '#818cf8', fontFamily: 'monospace', marginBottom: '8px', margin: 0 }}>{item.file} {item.function ? `(${item.function})` : ''}</p>}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                          {item.recommendation && <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}><strong>Action:</strong> {item.recommendation}</p>}
                                          {item.evidence && <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}><strong>Evidence:</strong> {item.evidence}</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (taskType === 'feature-generation') {
                        if (response.incompatible) {
                          return (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '16px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fca5a5', margin: '0 0 8px' }}>Incompatible Feature</h4>
                              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.6' }}>{response.reason}</p>
                            </div>
                          );
                        }
                        const { explanation, featureType, codeChanges, warnings } = response;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {explanation && (
                              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#818cf8', marginBottom: '8px', margin: 0 }}>Implementation Plan</h4>
                                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{explanation}</p>
                              </div>
                            )}
                            
                            {warnings && warnings.length > 0 && (
                              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fcd34d', marginBottom: '8px', margin: 0 }}>Warnings</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px' }}>
                                  {warnings.map((w, i) => <li key={i} style={{ marginBottom: '4px' }}>{w}</li>)}
                                </ul>
                              </div>
                            )}

                            {codeChanges && codeChanges.length > 0 && (
                              <div>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', margin: 0 }}>Code Changes ({codeChanges.length} files)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {codeChanges.map((change, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                                      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{change.filePath || change.file}</span>
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: change.action === 'create' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: change.action === 'create' ? '#6ee7b7' : '#93c5fd', textTransform: 'uppercase' }}>{change.action}</span>
                                      </div>
                                      {change.explanation && (
                                         <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                           <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{change.explanation}</p>
                                         </div>
                                      )}
                                      {change.modifiedCode && (
                                        <div style={{ padding: '16px', overflowX: 'auto', background: 'rgba(0,0,0,0.3)' }}>
                                          <pre style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{change.modifiedCode}</pre>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Fallback
                      return (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px 18px' }}>
                          <pre style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <LuHistory size={22} style={{ color: '#475569' }} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>No Task Selected</h3>
                <p style={{ fontSize: '13px', color: '#334155', maxWidth: '280px', lineHeight: '1.6' }}>
                  Click a task from the list to view its full prompt and AI response.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
