import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Post } from '../types';
import { Search as SearchIcon, X, Loader2, User as UserIcon, Grid as GridIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchText.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const q = query(
            collection(db, 'users'),
            where('username', '>=', searchText),
            where('username', '<=', searchText + '\uf8ff'),
            limit(20)
          );
          const snap = await getDocs(q);
          setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[]);
        } else {
          // Search in captions as a basic MVP
          const q = query(
            collection(db, 'posts'),
            where('caption', '>=', searchText),
            where('caption', '<=', searchText + '\uf8ff'),
            limit(20)
          );
          const snap = await getDocs(q);
          setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, activeTab]);

  return (
    <div className="bg-background min-h-screen">
      {/* Search Header */}
      <div className="px-6 py-4 sticky top-0 bg-background z-10 border-b border-white/5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search username or content..."
            className="w-full nox-input pl-12 pr-12"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
          />
          {searchText && (
            <button 
              onClick={() => setSearchText('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mt-6 gap-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-bold transition-colors",
              activeTab === 'users' ? "text-primary border-b-2 border-primary" : "text-text-secondary"
            )}
          >
            <UserIcon className="w-4 h-4" /> Users
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-bold transition-colors",
              activeTab === 'posts' ? "text-primary border-b-2 border-primary" : "text-text-secondary"
            )}
          >
            <GridIcon className="w-4 h-4" /> Posts
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'users' ? (
              users.map(user => (
                <div 
                  key={user.uid} 
                  onClick={() => navigate(`/profile/${user.uid}`)}
                  className="flex items-center gap-4 bg-surface p-4 rounded-2xl hover:bg-white/5 cursor-pointer"
                >
                  <img src={user.profile_pic} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                  <div>
                    <h4 className="font-bold text-text-primary">{user.username}</h4>
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest leading-none">
                      {user.followers_count} Followers
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {posts.map(post => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-surface cursor-pointer"
                    onClick={() => navigate(`/comments/${post.id}`)}
                  >
                    <img src={post.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}

            {!loading && searchText && (activeTab === 'users' ? users.length === 0 : posts.length === 0) && (
              <div className="text-center py-20 text-text-secondary">No results found</div>
            )}
            
            {!searchText && (
              <div className="text-center py-20 opacity-20 flex flex-col items-center">
                <SearchIcon className="w-12 h-12 mb-4" />
                <p>Find something new</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
