import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Post, UserProfile } from '../types';
import { Settings, Grid, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function ProfileScreen() {
  const { userId } = useParams();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();

  const targetId = userId || auth.currentUser?.uid;
  const isMe = targetId === auth.currentUser?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    // Fetch Profile
    const unsubProfile = onSnapshot(doc(db, 'users', targetId), (s) => {
      if (s.exists()) {
        const data = { uid: s.id, ...s.data() } as UserProfile;
        setProfile(data);
        setFollowing(data.followers?.includes(auth.currentUser?.uid || '') || false);
      }
    });

    const q = query(
      collection(db, 'posts'),
      where('user_id', '==', targetId),
      orderBy('created_at', 'desc')
    );

    const unsubPosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubPosts();
    };
  }, [targetId]);

  const handleFollow = async () => {
    if (!auth.currentUser || !targetId || isMe) return;
    setActionLoading(true);

    const myUid = auth.currentUser.uid;
    const myRef = doc(db, 'users', myUid);
    const targetRef = doc(db, 'users', targetId);

    try {
      if (following) {
        // Unfollow
        await updateDoc(myRef, { 
          following: arrayRemove(targetId),
          following_count: increment(-1)
        });
        await updateDoc(targetRef, { 
          followers: arrayRemove(myUid),
          followers_count: increment(-1)
        });
      } else {
        // Follow
        await updateDoc(myRef, { 
          following: arrayUnion(targetId),
          following_count: increment(1)
        });
        await updateDoc(targetRef, { 
          followers: arrayUnion(myUid),
          followers_count: increment(1)
        });

        // Notify
        await addDoc(collection(db, 'notifications'), {
          user_id: targetId,
          type: 'follow',
          triggered_by: myUid,
          triggered_by_name: myProfile?.username || 'Someone',
          created_at: serverTimestamp(),
          read: false
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  if (!profile) return (
    <div className="p-10 text-center">User not found</div>
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          {!isMe && (
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="font-display font-bold text-xl">{profile.username}</h2>
        </div>
        <div className="flex gap-4">
          {isMe && (
            <>
              <button className="text-text-primary">
                <Settings className="w-6 h-6" />
              </button>
              <button onClick={handleLogout} className="text-red-500">
                <LogOut className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Bio */}
      <div className="px-6 mt-6">
        <div className="flex items-center gap-8 mb-6">
          <img 
            src={profile.profile_pic} 
            className="w-20 h-20 rounded-full border-2 border-primary/20 p-1 object-cover bg-surface" 
            alt={profile.username}
          />
          <div className="flex flex-1 justify-around">
            <div className="text-center">
              <div className="font-bold text-xl">{posts.length}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{profile.followers_count}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{profile.following_count}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Following</div>
            </div>
          </div>
        </div>
        
        <h3 className="font-bold text-lg mb-1">{profile.username}</h3>
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
          {profile.bio}
        </p>

        {isMe ? (
          <button className="w-full mt-6 py-2 rounded-xl bg-surface border border-white/10 font-semibold text-sm hover:bg-white/5 transition-colors">
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleFollow}
            disabled={actionLoading}
            className={cn(
              "w-full mt-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
              following 
                ? "bg-surface border border-white/10 text-text-primary" 
                : "bg-primary text-white"
            )}
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-8 border-t border-white/5">
        <div className="flex justify-center py-3 border-b-2 border-primary w-1/2">
          <Grid className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 mt-0.5">
        {posts.map(post => (
          <div 
            key={post.id} 
            className="aspect-square bg-surface cursor-pointer overflow-hidden"
            onClick={() => navigate(`/comments/${post.id}`)}
          >
            <img 
              src={post.image_url} 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
              alt="User post"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
        {posts.length === 0 && (
          <div className="col-span-3 py-20 text-center text-text-secondary">
            No posts yet
          </div>
        )}
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
