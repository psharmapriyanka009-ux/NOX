import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import StoriesBar from '../components/StoriesBar';
import { Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDiscovery, setIsDiscovery] = useState(false);

  useEffect(() => {
    let q;
    const uid = auth.currentUser?.uid;

    if (isDiscovery || !profile?.following || profile.following.length === 0) {
      // Global Feed
      q = query(
        collection(db, 'posts'),
        orderBy('created_at', 'desc'),
        limit(20)
      );
    } else {
      // Following feed (including self)
      const feedUids = [...(profile.following || []), uid].filter(Boolean) as string[];
      q = query(
        collection(db, 'posts'),
        where('user_id', 'in', feedUids.slice(0, 10)),
        orderBy('created_at', 'desc'),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.following, isDiscovery]);

  return (
    <div className="pb-24">
      {/* App Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-2xl tracking-tight text-primary">NOX</h1>
          <button 
            onClick={() => setIsDiscovery(!isDiscovery)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              isDiscovery ? "bg-primary border-primary text-white" : "border-white/10 text-text-secondary"
            )}
          >
            {isDiscovery ? 'Discovery' : 'Following'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/add-reel" 
            className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-5 h-5 text-text-secondary" />
          </Link>
          <Link 
            to="/add-post" 
            className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Stories */}
      <StoriesBar />

      {/* Feed */}
      <div className="max-w-xl mx-auto px-4 mt-4 space-y-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface rounded-full"></div>
                <div className="w-24 h-4 bg-surface rounded"></div>
              </div>
              <div className="w-full aspect-square bg-surface rounded-2xl"></div>
              <div className="w-3/4 h-4 bg-surface rounded"></div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-10">
            <Users className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-20" />
            <h3 className="font-bold mb-2">Build your timeline</h3>
            <p className="text-text-secondary text-sm text-balance">
              Follow people to see their latest shots here, or switch to discovery.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
