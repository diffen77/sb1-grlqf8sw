import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

export function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  location.pathname === '/'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                Home
              </Link>
              {user && isAdmin && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                    location.pathname === '/admin'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Admin
                </Link>
              )}
            </div>
            {user && (
              <div className="flex items-center">
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <Outlet />
    </div>
  );
}