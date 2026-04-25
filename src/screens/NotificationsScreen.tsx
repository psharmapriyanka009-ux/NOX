import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Notification } from '../types';
import { Heart, UserPlus, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', auth.currentUser.uid),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(data);
      setLoading(false);

      // Mark all as read
      snapshot.docs.forEach(d => {
        if (!d.data().read) {
          updateDoc(doc(db, 'notifications', d.id), { read: true });
        }
      });
    });

    return unsubscribe;
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-primary" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getMessage = (notif: Notification) => {
    switch (notif.type) {
      case 'like': return 'liked your post.';
      case 'follow': return 'started following you.';
      case 'comment': return 'commented on your post.';
      default: return '';
    }
  };

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-white/5 sticky top-0 bg-background z-10">
        <h2 className="font-display font-bold text-xl">Notifications</h2>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">No notifications yet</div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => navigate(notif.post_id ? `/comments/${notif.post_id}` : `/profile/${notif.triggered_by}`)}
              className={cn(
                "p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-colors",
                notif.read ? "bg-transparent" : "bg-white/5"
              )}
            >
              <div className="relative">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.triggered_by}`} 
                  className="w-12 h-12 rounded-full border border-white/10" 
                  alt="" 
                />
                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1 border border-white/10">
                  {getIcon(notif.type)}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{notif.triggered_by_name}</span> {getMessage(notif)}
                </p>
                <span className="text-[10px] text-text-secondary uppercase mt-1">
                  {notif.created_at?.toDate ? formatDistanceToNow(notif.created_at.toDate()) : 'just now'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
