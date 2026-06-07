import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/repoService';
import { taskService } from '../services/taskService';
import {
  LuFolderGit2,
  LuBrain,
  LuHistory,
  LuPlus,
  LuArrowRight,
  LuZap,
  LuTrendingUp,
  LuClock,
} from 'react-icons/lu';

export default function Dashboard() {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [reposRes, tasksRes] = await Promise.all([
        repoService.getAll(),
        taskService.getAll({ limit: 5 }),
      ]);
      setRepos(reposRes.data);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: 'Repositories', value: repos.length, icon: LuFolderGit2, color: '#6366f1' },
    { label: 'AI Tasks', value: tasks.length, icon: LuBrain, color: '#8b5cf6' },
    { label: 'Latest Activity', value: tasks[0] ? 'Today' : 'None', icon: LuTrendingUp, color: '#10b981' },
  ];

  const taskTypeLabels = {
    analysis: 'Analysis',
    chat: 'Chat',
    suggestions: 'Suggestions',
    'feature-generation': 'Feature Gen',
  };

  const taskTypeColors = {
    analysis: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    chat: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    suggestions: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'feature-generation': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="skeleton h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Overview
        </h1>
        <p className="text-gray-400 text-sm">
          Welcome back, {user?.name?.split(' ')[0]}. Here's what's happening across your repositories.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6 hover:bg-white/[0.02] transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
              >
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/repositories"
            className="group card p-6 hover:border-primary-500/50 transition-all duration-300 flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 group-hover:border-primary-400 transition-all">
              <LuPlus className="text-primary-400 text-xl group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Import Repository</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Add a new GitHub repository for AI analysis.</p>
            </div>
            <LuArrowRight className="text-gray-600 group-hover:text-primary-400 transition-all group-hover:translate-x-1" />
          </Link>

          <Link
            to="/chat"
            className="group card p-6 hover:border-purple-500/50 transition-all duration-300 flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
              <LuZap className="text-purple-400 text-xl group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">AI Code Chat</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Ask questions or request features for your codebases.</p>
            </div>
            <LuArrowRight className="text-gray-600 group-hover:text-purple-400 transition-all group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Main Grid: Repos & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Recent Repositories */}
        <div className="card flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight">Recent Repositories</h2>
            <Link to="/repositories" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2 flex-1 flex flex-col">
            {repos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-3">
                  <LuFolderGit2 className="text-gray-500" size={20} />
                </div>
                <p className="text-gray-400 text-sm font-medium">No repositories yet</p>
                <Link to="/repositories" className="text-primary-400 text-xs mt-2 hover:underline">
                  Import your first repo →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {repos.slice(0, 5).map((repo) => (
                  <Link
                    key={repo._id}
                    to={`/repositories/${repo._id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface-800 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-primary-500/30 transition-colors">
                      <LuFolderGit2 className="text-gray-400 group-hover:text-primary-400 transition-colors" size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                        {repo.owner}/{repo.repoName}
                      </p>
                      {repo.language && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary-500/80" />
                          {repo.language}
                        </p>
                      )}
                    </div>
                    <LuArrowRight className="text-gray-600 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" size={16} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight">Recent AI Activity</h2>
            <Link to="/tasks" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2 flex-1 flex flex-col">
            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-3">
                  <LuHistory className="text-gray-500" size={20} />
                </div>
                <p className="text-gray-400 text-sm font-medium">No AI activity found</p>
                <p className="text-gray-600 text-xs mt-1">Your AI interactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface-800 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <LuBrain className="text-gray-400 group-hover:text-purple-400 transition-colors" size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors">
                        {task.prompt}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border ${taskTypeColors[task.taskType]}`}>
                          {taskTypeLabels[task.taskType]}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <LuClock size={10} />
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
