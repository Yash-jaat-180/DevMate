import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { toast } from 'sonner';
import { LuHistory, LuTrash2, LuBrain, LuWandSparkles, LuMessageSquare, LuLightbulb, LuClock, LuExternalLink, LuLoader } from 'react-icons/lu';

const typeConfig = {
  analysis: { label: 'Analysis', icon: LuBrain, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  chat: { label: 'Chat', icon: LuMessageSquare, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  suggestions: { label: 'Suggestions', icon: LuLightbulb, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'feature-generation': { label: 'Feature Gen', icon: LuWandSparkles, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
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
      setTasks((t) => t.filter((x) => x._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { toast.error('Failed to delete task'); }
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Task History</h1>
          <p className="text-gray-400 text-sm mt-1">Review your past AI interactions and generated code</p>
        </div>
        <div className="flex gap-2">
          {['', 'analysis', 'chat', 'suggestions', 'feature-generation'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${filter === f ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-surface-800 text-gray-400 border border-white/5 hover:text-white hover:bg-surface-850'}`}>
              {f ? typeConfig[f]?.label : 'All Tasks'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* List */}
        <div className="w-96 overflow-y-auto space-y-3 flex-shrink-0 custom-scrollbar pr-2 pb-6">
          {loading ? (
            [1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 card rounded-xl">
              <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <LuHistory className="text-xl text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium text-sm">No tasks found</p>
              <p className="text-gray-500 text-xs mt-1">Your AI interactions will appear here</p>
            </div>
          ) : tasks.map((task) => {
            const cfg = typeConfig[task.taskType] || typeConfig.chat;
            const isSelected = selected?._id === task._id;
            return (
              <button key={task._id} onClick={() => viewTask(task._id)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${isSelected ? 'bg-surface-800 border-primary-500/30 shadow-md' : 'bg-surface-850 border-white/5 hover:bg-surface-800 hover:border-white/10'}`}>
                <div className="flex items-start justify-between mb-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }} className="text-gray-500 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded"><LuTrash2 size={14} /></button>
                </div>
                <p className="text-[13px] text-gray-200 truncate font-medium mb-2">{task.prompt}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><LuClock size={12} /> {new Date(task.createdAt).toLocaleDateString()}</span>
                  {task.repositoryId && <span className="truncate max-w-[120px]">&bull; {task.repositoryId.repoName}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
          <div className="h-full card p-6 lg:p-8 flex flex-col">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <LuLoader className="animate-spin text-primary-400 mb-3" size={28} />
                <p className="text-sm">Loading task details...</p>
              </div>
            ) : selected ? (
              <div className="space-y-6 animate-fade-in flex-1">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${typeConfig[selected.taskType]?.color}`}>{typeConfig[selected.taskType]?.label}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><LuClock size={12}/> {new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  {selected.repositoryId && (
                    <Link to={`/repositories/${selected.repositoryId._id || selected.repositoryId}`} className="text-xs text-primary-400 hover:text-primary-300 transition-colors hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500/10 border border-primary-500/20">
                      View Repository <LuExternalLink size={12} />
                    </Link>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-400 font-medium mb-2">Prompt</h3>
                  <div className="p-4 rounded-lg bg-surface-800 border border-white/5">
                    <p className="text-[15px] text-white leading-relaxed">{selected.prompt}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm text-gray-400 font-medium mb-2">Response</h3>
                  <div className="p-5 rounded-lg bg-surface-800 border border-white/5 min-h-[300px]">
                    <pre className="text-[14px] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {typeof selected.response === 'string' ? selected.response : JSON.stringify(selected.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/5 flex items-center justify-center mb-4">
                  <LuHistory className="text-2xl text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Task Selected</h3>
                <p className="text-sm text-gray-400 max-w-sm">Select a task from the list to view its full details, prompt, and AI response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
