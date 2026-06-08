import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { repoService } from '../services/repoService';
import { toast } from 'sonner';
import { LuFolderGit2, LuPlus, LuLoader, LuStar, LuGitFork, LuSearch, LuTrash2, LuX, LuArrowRight } from 'react-icons/lu';

/* shared style objects */
const CARD = {
  background: '#111118',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px',
};

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
    } catch { toast.error('Failed to load repositories'); }
    finally { setLoading(false); }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      await repoService.importRepo(importUrl.trim());
      toast.success('Repository imported! AI summary is being generated.');
      setImportUrl('');
      setShowImport(false);
      loadRepos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import repository');
    } finally { setImporting(false); }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await repoService.delete(id);
      toast.success('Repository deleted');
      setRepos(r => r.filter(repo => repo._id !== id));
    } catch { toast.error('Failed to delete repository'); }
  }

  const filtered = repos.filter(r =>
    `${r.owner}/${r.repoName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '48px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Repositories</h1>
          <p style={{ fontSize: '13px', color: '#475569' }}>Manage your imported GitHub repositories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowImport(true)}>
          <LuPlus size={15} /> Import Repository
        </button>
      </div>

      {/* ── Search ── */}
      {repos.length > 0 && (
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <LuSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
          <input
            className="input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories..."
            style={{ paddingLeft: '36px' }}
          />
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>Import Repository</h2>
                <p style={{ fontSize: '12px', color: '#475569' }}>Connect a public GitHub repository</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowImport(false)}><LuX size={16} /></button>
            </div>

            <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  GitHub URL
                </label>
                <input
                  className="input"
                  type="url"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  autoFocus
                />
              </div>

              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', padding: '12px 16px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                  The repository must be public. DevMate will auto-generate a deep architecture summary after import.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={importing || !importUrl.trim()}>
                  {importing ? <><LuLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing…</> : <><LuPlus size={14} /> Import</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Grid / Empty State ── */}
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', ...CARD, border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <LuFolderGit2 size={24} style={{ color: '#818cf8' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
            {repos.length === 0 ? 'No repositories yet' : 'No results found'}
          </h3>
          <p style={{ fontSize: '13px', color: '#475569', maxWidth: '320px', lineHeight: '1.6', marginBottom: '24px' }}>
            {repos.length === 0 ? 'Import your first GitHub repository to start using DevMate AI tools.' : 'Try a different search term.'}
          </p>
          {repos.length === 0 && (
            <button className="btn btn-primary btn-lg" onClick={() => setShowImport(true)}>
              <LuPlus size={16} /> Connect Repository
            </button>
          )}
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filtered.map(repo => (
            <div key={repo._id} style={{ ...CARD, position: 'relative', transition: 'border-color 200ms, transform 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Link to={`/repositories/${repo._id}`} style={{ display: 'flex', flexDirection: 'column', padding: '20px', textDecoration: 'none', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LuFolderGit2 size={17} style={{ color: '#818cf8' }} />
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); handleDelete(repo._id, repo.repoName); }}
                    style={{ opacity: 0, padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', transition: 'all 180ms' }}
                    className="delete-btn"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {repo.repoName}
                </h3>
                <p style={{ fontSize: '11px', color: '#475569', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  {repo.owner}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {repo.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        {repo.language}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuStar size={11} />{repo.stars ?? 0}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuGitFork size={11} />{repo.forks ?? 0}</span>
                  </div>
                  <LuArrowRight size={14} style={{ color: '#334155' }} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <style>{`.delete-btn { opacity: 0 !important; } div:hover > a > div > .delete-btn { opacity: 1 !important; }`}</style>
    </div>
  );
}
