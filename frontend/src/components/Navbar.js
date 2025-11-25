import React, { useState } from 'react';
import { Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedProfile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F14]/80 backdrop-blur-xl border-b border-white/5" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-red-600 neon cursor-pointer" onClick={() => navigate('/browse')} data-testid="logo">
              NebulaStream
            </h1>
            <div className="hidden md:flex space-x-6">
              <button onClick={() => navigate('/browse')} className="text-red-600 hover:text-red-400 transition-colors" data-testid="nav-browse">Browse</button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles..."
                  className="bg-white/5 border border-red-800/10 rounded-full px-4 py-2 pl-10 w-64 text-red-600 placeholder-red-400 focus:outline-none focus:border-red-600 transition-colors"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-red-400" />
              </div>
            </form>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger data-testid="user-menu-trigger">
                  <Avatar className="w-10 h-10 bg-red-600 cursor-pointer">
                    <AvatarFallback className="bg-transparent text-white font-semibold">
                      {selectedProfile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1f2e] border-red-800/10 text-red-600" data-testid="user-menu">
                  <DropdownMenuItem onClick={() => navigate('/profiles')} className="cursor-pointer hover:bg-white/5" data-testid="switch-profile-btn">
                    <User className="mr-2 h-4 w-4" />
                    Switch Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer hover:bg-white/5" data-testid="logout-btn">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
