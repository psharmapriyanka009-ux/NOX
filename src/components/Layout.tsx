import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, User, Search, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();
  
  // Hide bottom nav on some pages if needed (e.g. Add Post)
  const isHideNav = ['/add-post', '/add-reel', '/add-story'].includes(location.pathname);

  if (isHideNav) return <Outlet />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-screen">
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/5 px-6 py-3 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <NavLink 
            to="/home" 
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
            <Home className="w-7 h-7" />
          </NavLink>
          
          <NavLink 
            to="/explore" 
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
            <Search className="w-7 h-7" />
          </NavLink>

          <NavLink 
            to="/reels" 
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
            <PlayCircle className="w-7 h-7" />
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
            <User className="w-7 h-7" />
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
