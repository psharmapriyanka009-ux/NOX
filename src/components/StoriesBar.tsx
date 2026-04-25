import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Story } from '../types';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([]);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expires_at', '>', now),
      orderBy('expires_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
      
      // Group by user (show latest story per user for the bar)
      const uniqueUsers: Record<string, Story> = {};
      data.forEach(s => {
        if (!uniqueUsers[s.user_id] || s.created_at?.seconds > uniqueUsers[s.user_id].created_at?.seconds) {
          uniqueUsers[s.user_id] = s;
        }
      });
      
      setStories(Object.values(uniqueUsers));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto px-6 py-4 no-scrollbar border-b border-white/5">
      {/* Add Story */}
      <div className="flex flex-col items-center gap-1 min-w-[70px]">
        <div 
          onClick={() => navigate('/add-story')}
          className="w-16 h-16 rounded-full bg-surface border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Plus className="w-6 h-6 text-text-secondary" />
        </div>
        <span className="text-[10px] text-text-secondary font-medium">Your Story</span>
      </div>

      {/* User Stories */}
      {stories.map(story => {
        const hasViewed = story.viewers.includes(auth.currentUser?.uid || '');
        return (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
            onClick={() => navigate(`/story/${story.user_id}`)}
          >
            <div className={cn(
              "p-0.5 rounded-full transition-all duration-500",
              hasViewed ? "bg-white/10" : "bg-gradient-to-tr from-primary to-purple-400 p-[2px] shadow-[0_0_10px_rgba(123,47,255,0.3)]"
            )}>
              <div className="bg-background rounded-full p-0.5">
                <img 
                  src={story.user_avatar} 
                  className="w-14 h-14 rounded-full object-cover bg-surface" 
                  alt="" 
                />
              </div>
            </div>
            <span className="text-[10px] text-text-primary/80 font-medium truncate w-16 text-center">
              {story.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
