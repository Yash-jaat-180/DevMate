import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repoService } from '../services/repoService';
import { aiService } from '../services/aiService';
import { toast } from 'sonner';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  LuFolderGit2, LuFile, LuFolder, LuFolderOpen, LuChevronRight, LuChevronDown,
  LuLoader, LuBrain, LuWandSparkles, LuLightbulb, LuArrowLeft, LuStar,
  LuGitFork, LuSend, LuFileCode2, LuShield, LuZap, LuTrendingUp, LuRefreshCw,
  LuCircleCheck
} from 'react-icons/lu';

/* ── helpers ─────────────────────────────────────── */
function buildTree(flatList) {
  const root = { children: {} };
  flatList.forEach(({ path, type }) => {
    const parts = path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: i === parts.length - 1 ? type : 'directory',
          children: {},
        };
      }
      node = node.children[part];
    });
  });
  return root.children;
}

function TreeNode({ node, onSelect, selectedPath, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = node.type === 'directory';
  const children = Object.values(node.children || {}).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        onClick={() => { isDir ? setOpen(!open) : onSelect(node.path); }}
        className={`flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-[13px] rounded-md transition-colors ${isSelected ? 'bg-primary-500/15 text-primary-300' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (open ? <LuChevronDown size={14} className="text-gray-500" /> : <LuChevronRight size={14} className="text-gray-500" />) : <span className="w-3.5" />}
        {isDir ? (open ? <LuFolderOpen size={14} className="text-primary-400" /> : <LuFolder size={14} className="text-gray-500" />) : <LuFile size={14} className="text-gray-500" />}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && open && children.map((c) => (
        <TreeNode key={c.path} node={c} onSelect={onSelect} selectedPath={selectedPath} depth={depth + 1} />
      ))}
    </div>
  );
}

function langFromPath(p) {
  const ext = p.split('.').pop();
  const m = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', json: 'json', md: 'markdown', css: 'css', html: 'html', yml: 'yaml', yaml: 'yaml', java: 'java', go: 'go', rs: 'rust', rb: 'ruby', php: 'php', sql: 'sql', sh: 'shell' };
  return m[ext] || 'plaintext';
}

/* ── Main Component ──────────────────────────────── */
export default function RepositoryDetails() {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // Layout state
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(380);
  const [rightPanelMode, setRightPanelMode] = useState('insights'); // 'insights' | 'feature'
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  // Explorer state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  // AI state
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [featureResult, setFeatureResult] = useState(null);
  const [featurePrompt, setFeaturePrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [repoRes, treeRes] = await Promise.all([repoService.getById(id), repoService.getTree(id)]);
        setRepo(repoRes.data);
        setTree(buildTree(treeRes.data.tree));
      } catch { toast.error('Failed to load repository'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft.current) {
        setLeftWidth(Math.max(150, Math.min(e.clientX - 240, 500))); // 240 is sidebar width approx
      }
      if (isDraggingRight.current) {
        setRightWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, 800)));
      }
    };
    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const loadFile = useCallback(async (path) => {
    setSelectedFile(path);
    setFileLoading(true);
    try {
      const { data } = await repoService.getFile(id, path);
      setFileContent(data.content);
    } catch { toast.error('Failed to load file'); setFileContent('// Error loading file'); }
    finally { setFileLoading(false); }
  }, [id]);

  async function runAnalysis() {
    setAiLoading(true);
    try {
      const { data } = await aiService.analyze(id);
      setAnalysis(data.analysis);
      toast.success('Analysis complete');
    } catch { toast.error('Analysis failed'); }
    finally { setAiLoading(false); }
  }

  async function runSuggestions() {
    setAiLoading(true);
    try {
      const { data } = await aiService.suggestions(id);
      setSuggestions(data.suggestions);
      toast.success('Suggestions generated');
    } catch { toast.error('Failed to generate suggestions'); }
    finally { setAiLoading(false); }
  }

  async function runFeature(e) {
    e.preventDefault();
    if (!featurePrompt.trim()) return;
    setAiLoading(true);
    setRightPanelMode('feature');
    try {
      const { data } = await aiService.generateFeature(id, featurePrompt.trim());
      setFeatureResult(data.result);
      toast.success('Feature implementation generated!');
    } catch { toast.error('Feature generation failed'); }
    finally { setAiLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="skeleton h-14 w-full mb-4" />
        <div className="flex flex-1 gap-4">
          <div className="skeleton w-64 h-full" />
          <div className="skeleton flex-1 h-full" />
          <div className="skeleton w-96 h-full" />
        </div>
      </div>
    );
  }

  if (!repo) return <div className="text-center py-20 text-gray-400">Repository not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in -mx-4 lg:-mx-8">
      {/* Header */}
      <div className="px-4 lg:px-8 pb-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/repositories" className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-800 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <LuArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <LuFolderGit2 className="text-gray-500" size={16} />
              <h1 className="text-lg font-semibold text-white tracking-tight">{repo.owner} / {repo.repoName}</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{repo.description || 'No description provided'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-400" />
            <span>{repo.language || 'Mixed'}</span>
          </div>
          <span className="flex items-center gap-1.5"><LuStar size={14} /> {repo.stars}</span>
          <span className="flex items-center gap-1.5"><LuGitFork size={14} /> {repo.forks}</span>
        </div>
      </div>

      {/* 3-Panel Workspace */}
      <div className="flex flex-1 overflow-hidden mt-4 bg-surface-950 border-y border-white/5 relative">
        
        {/* LEFT PANEL: Explorer */}
        <div style={{ width: leftWidth }} className="flex flex-col border-r border-white/5 bg-surface-900 flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/5 bg-surface-850 flex-shrink-0">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {tree && Object.values(tree).sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1)
              .map((n) => <TreeNode key={n.path} node={n} onSelect={loadFile} selectedPath={selectedFile} />)}
          </div>
        </div>

        {/* Resizer Left */}
        <div
          className="w-1 cursor-col-resize hover:bg-primary-500/50 active:bg-primary-500 transition-colors z-10"
          onMouseDown={() => {
            isDraggingLeft.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* CENTER PANEL: Monaco Viewer & Diff Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {rightPanelMode === 'feature' && featureResult?.codeChanges?.length > 0 ? (
            // Full Width Diff Viewer Mode
            <div className="flex-1 flex flex-col h-full bg-surface-900">
              <div className="px-4 py-3 border-b border-white/5 bg-surface-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuWandSparkles className="text-accent-400" size={16} />
                  <span className="text-sm font-medium text-white">Feature Changes Review</span>
                </div>
                <button onClick={() => setRightPanelMode('insights')} className="text-xs text-gray-400 hover:text-white">Close Diff</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {featureResult.codeChanges.map((change, i) => (
                  <div key={i} className="card overflow-hidden border border-white/10 shadow-2xl">
                    <div className="px-4 py-3 border-b border-white/5 bg-surface-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LuFileCode2 size={14} className="text-gray-400" />
                        <span className="text-sm font-mono text-gray-200">{change.file}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2 ${change.action === 'create' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{change.action}</span>
                      </div>
                    </div>
                    {change.action === 'modify' && change.originalCode && change.modifiedCode ? (
                      <DiffEditor height="500px" language={change.language || 'javascript'} original={change.originalCode} modified={change.modifiedCode} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, renderSideBySide: true, scrollBeyondLastLine: false }} />
                    ) : (
                      <Editor height="400px" language={change.language || 'javascript'} value={change.modifiedCode || ''} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 12 }, scrollBeyondLastLine: false }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Standard File Viewer Mode
            <>
              <div className="px-4 py-3 border-b border-white/5 bg-surface-850 flex-shrink-0 flex items-center gap-2">
                <LuFileCode2 className="text-gray-500" size={14} />
                <span className="text-sm text-gray-300 font-mono">{selectedFile || 'No file selected'}</span>
              </div>
              <div className="flex-1 h-full">
                {selectedFile ? (
                  fileLoading ? (
                    <div className="flex items-center justify-center h-full"><LuLoader className="animate-spin text-gray-500" size={24} /></div>
                  ) : (
                    <Editor height="100%" language={langFromPath(selectedFile)} value={fileContent} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, fontLigatures: true, padding: { top: 16 }, scrollBeyondLastLine: false }} />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <LuCode size={48} className="text-gray-700 mb-4" />
                    <p className="text-sm">Select a file from the explorer to view its contents.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Resizer Right */}
        <div
          className="w-1 cursor-col-resize hover:bg-primary-500/50 active:bg-primary-500 transition-colors z-10"
          onMouseDown={() => {
            isDraggingRight.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* RIGHT PANEL: Insights & Feature Generator */}
        <div style={{ width: rightWidth }} className="flex flex-col border-l border-white/5 bg-surface-900 flex-shrink-0">
          {/* Right Panel Header Tabs */}
          <div className="flex items-center border-b border-white/5 bg-surface-850 px-2 flex-shrink-0">
            <button onClick={() => setRightPanelMode('insights')} className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 ${rightPanelMode === 'insights' ? 'border-primary-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Insights</button>
            <button onClick={() => setRightPanelMode('feature')} className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5 ${rightPanelMode === 'feature' ? 'border-accent-500 text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><LuWandSparkles size={14} /> Feature Gen</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            
            {/* --- INSIGHTS MODE --- */}
            {rightPanelMode === 'insights' && (
              <div className="space-y-8 animate-fade-in">
                {/* Repository Summary Cache */}
                {repo.summary?.projectSummary && (
                  <section>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><LuBrain className="text-primary-400" /> AI Summary</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed mb-4">{repo.summary.projectSummary}</p>
                    {repo.summary.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {repo.summary.techStack.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[11px] text-gray-300 font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Analysis Section */}
                <section className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Deep Analysis</h3>
                    {!analysis && (
                      <button onClick={runAnalysis} disabled={aiLoading} className="text-[11px] font-medium text-primary-400 hover:text-primary-300 disabled:opacity-50 flex items-center gap-1">
                        {aiLoading ? 'Analyzing...' : 'Run Analysis'}
                      </button>
                    )}
                  </div>
                  {!analysis ? (
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-xs text-gray-500">Run a deep analysis to evaluate code quality, architecture patterns, and potential issues.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analysis.codeQuality && (
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Quality Score</span>
                            <span className="text-sm font-bold text-white">{analysis.codeQuality.score}/10</span>
                          </div>
                          <div className="space-y-2">
                            {analysis.codeQuality.strengths?.slice(0,2).map((s,i) => <p key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-accent-400">✓</span>{s}</p>)}
                            {analysis.codeQuality.concerns?.slice(0,2).map((s,i) => <p key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-amber-400">!</span>{s}</p>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Suggestions Section */}
                <section className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Suggestions</h3>
                    {!suggestions && (
                      <button onClick={runSuggestions} disabled={aiLoading} className="text-[11px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50">
                        {aiLoading ? 'Generating...' : 'Get Suggestions'}
                      </button>
                    )}
                  </div>
                  {!suggestions ? (
                     <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-xs text-gray-500">Generate context-aware suggestions for performance, security, and refactoring.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {['performance', 'security', 'codeQuality'].filter(k => suggestions[k]?.length).map(k => (
                        <div key={k} className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">{k}</span>
                          <p className="text-[13px] text-gray-300 font-medium">{suggestions[k][0].title}</p>
                          <p className="text-xs text-gray-500 mt-1">{suggestions[k][0].description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* --- FEATURE GENERATOR MODE --- */}
            {rightPanelMode === 'feature' && (
              <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <div className="flex-shrink-0">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><LuWandSparkles className="text-accent-400" /> What do you want to build?</h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">Describe a feature, bug fix, or refactor. The AI will generate an implementation plan and the exact code modifications.</p>
                  
                  <form onSubmit={runFeature} className="space-y-3">
                    <textarea 
                      value={featurePrompt} 
                      onChange={(e) => setFeaturePrompt(e.target.value)} 
                      placeholder="e.g., Add dark mode support to the application..."
                      rows={4}
                      className="w-full p-3 rounded-lg bg-surface-800 border border-white/10 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-accent-500/50 resize-none transition-colors"
                    />
                    <button type="submit" disabled={aiLoading || !featurePrompt.trim()} className="w-full py-2.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {aiLoading ? <><LuLoader className="animate-spin" size={14} /> Processing Context...</> : <><LuSend size={14} /> Generate Feature</>}
                    </button>
                  </form>
                </div>

                {/* Timeline Implementation Plan */}
                {featureResult?.implementationPlan && (
                  <div className="pt-6 border-t border-white/5 flex-1">
                    <h3 className="text-sm font-semibold text-white mb-4">Implementation Plan</h3>
                    <p className="text-[13px] text-gray-400 mb-6">{featureResult.implementationPlan.overview}</p>
                    
                    <div className="relative border-l border-white/10 ml-3 space-y-6">
                      {featureResult.implementationPlan.steps?.map((step, i) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-900 border-2 border-accent-500 flex items-center justify-center">
                            <LuCircleCheck size={10} className="text-accent-500 hidden" />
                          </div>
                          <p className="text-[13px] text-gray-300 leading-relaxed -mt-1">{step}</p>
                        </div>
                      ))}
                    </div>

                    {featureResult.filesToModify?.length > 0 && (
                      <div className="mt-8">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Files Affected</h4>
                        <div className="space-y-2">
                          {featureResult.filesToModify.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                              <span className="text-xs font-mono text-gray-300 truncate pr-2">{f.path}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${f.action === 'create' ? 'text-green-400 bg-green-400/10' : 'text-blue-400 bg-blue-400/10'}`}>{f.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
