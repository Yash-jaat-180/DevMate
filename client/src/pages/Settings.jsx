import { useAuth } from '../context/AuthContext';
import { LuUser, LuMail, LuCalendar, LuBrain } from 'react-icons/lu';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your account</p>

      <div className="rounded-xl glass p-6 space-y-6">
        <h3 className="font-semibold text-white flex items-center gap-2"><LuUser size={16} className="text-primary-400" />Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4 pt-2 border-t border-white/5">
          {[
            { icon: LuUser, label: 'Name', value: user?.name },
            { icon: LuMail, label: 'Email', value: user?.email },
            { icon: LuCalendar, label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="text-gray-500" size={16} />
              <span className="text-sm text-gray-400 w-28">{label}</span>
              <span className="text-sm text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl glass p-6 mt-6">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4"><LuBrain size={16} className="text-primary-400" />About DevMate</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          DevMate is an AI-powered GitHub code assistant built with React, Express.js, MongoDB, and Google Gemini AI.
          It features intelligent repository analysis, a context-aware AI chat, code improvement suggestions, and a feature generator with diff viewing.
        </p>
        <p className="text-xs text-gray-600 mt-3">Version 1.0.0</p>
      </div>
    </div>
  );
}
