// src/components/NotFound.tsx
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-xl mb-8">Page not found or invalid link.</p>
      <Link 
        to="/" 
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors"
      >
        Return to Login
      </Link>
    </div>
  );
};