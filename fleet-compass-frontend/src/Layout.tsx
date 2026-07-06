
import type { ReactNode } from 'react';
interface LayoutProps {
  children: ReactNode; 
}
export const AppLayout = ({ children }: LayoutProps) => {
  return (
    <>
      <div className="hidden md:block">
        {children}
      </div>

      <div className="flex md:hidden h-screen items-center justify-center p-8 text-center bg-slate-950 text-slate-400">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Desktop Access Required</h2>
          <p>Fleet Compass operations are optimized for wide-screen control rooms. Please access this dashboard from a desktop or laptop browser.</p>
        </div>
      </div>
    </>
  );
};