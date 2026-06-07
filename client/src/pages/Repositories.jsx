import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { repoService } from '../services/repoService';
import { toast } from 'sonner';
import {
  LuFolderGit2,
  LuPlus,
  LuLoader,
  LuStar,
  LuGitFork,
  LuSearch,
  LuTrash2,
  LuX,
  LuArrowRight,
} from 'react-icons/lu';

export default function Repositories() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadRepos(); }, []);

  async function loadRepos() {
    try {
      const { data } = await repoService.getAll();
      setRepos(data);
    } catch (err) {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      await repoService.importRepo(importUrl.trim());
      toast.success('Repository imported successfully! AI summary is being generated.');
      setImportUrl('');
      setShowImport(false);
      loadRepos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import repository');
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await repoService.delete(id);
      toast.success('Repository deleted');
      setRepos((r) => r.filter((repo) => repo._id !== id));
    } catch (err) {
      toast.error('Failed to delete repository');
    }
  }

  const filtered = repos.filter((r) =>
    `${r.owner}/${r.repoName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="skeleton h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Repositories</h1>
          <p className="text-gray-400 text-sm mt-2">Manage your imported GitHub repositories for AI analysis</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <LuPlus size={16} /> Import Repository
        </button>
      </div>

      {/* Search */}
      {repos.length > 0 && (
        <div className="relative max-w-md">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-white/10 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm"
          />
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-lg p-8 rounded-2xl bg-surface-850 border border-white/10 animate-fade-in-scale shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Import Repository</h3>
                <p className="text-sm text-gray-400 mt-1">Connect a public GitHub repository</p>
              </div>
              <button onClick={() => setShowImport(false)} className="w-8 h-8 rounded-lg bg-surface-800 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/10 transition-all">
                <LuX size={16} />
              </button>
            </div>
            <form onSubmit={handleImport}>
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-gray-300 mb-2 block tracking-wide uppercase">GitHub URL</label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/10 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-all"
                  autoFocus
                />
              </div>
              <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 mb-8">
                <p className="text-[13px] text-gray-300 leading-relaxed">
                  The repository must be public. DevMate will automatically clone the repository, generate a deep architecture summary, and cache its context.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="px-5 py-2.5 rounded-lg bg-surface-800 border border-white/5 text-gray-300 text-sm font-medium hover:bg-surface-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importUrl.trim()}
                  className="px-6 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {importing ? <><LuLoader className="animate-spin" size={16} /> Importing...</> : <><LuPlus size={16} /> Import Now</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repository Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 card rounded-2xl border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
            <LuFolderGit2 className="text-3xl text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {repos.length === 0 ? 'No repositories yet' : 'No matching repositories'}
          </h3>
          <p className="text-gray-400 text-[15px] mb-8 max-w-sm text-center">
            {repos.length === 0 ? 'Import your first GitHub repository to start using DevMate AI tools.' : 'Try a different search term or check your spelling.'}
          </p>
          {repos.length === 0 && (
            <button
              onClick={() => setShowImport(true)}
              className="px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <LuPlus size={18} /> Connect Repository
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filtered.map((repo) => (
            <div key={repo._id} className="group card hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col h-[220px]">
              <Link to={`/repositories/${repo._id}`} className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-800 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/10 group-hover:border-primary-500/20 transition-all">
                    <LuFolderGit2 className="text-gray-400 group-hover:text-primary-400 transition-colors" size={20} />
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(repo._id, repo.repoName); }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white tracking-tight mb-1 group-hover:text-primary-300 transition-colors">
                    {repo.repoName}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{repo.owner}</p>
                  <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed">
                    {repo.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-400" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><LuStar size={12} />{repo.stars}</span>
                  </div>
                  <LuArrowRight className="text-gray-600 group-hover:text-primary-400 transition-colors group-hover:translate-x-1" size={16} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
