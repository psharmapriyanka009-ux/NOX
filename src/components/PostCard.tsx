import React, { useState } from 'react';
import { Post } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const isLiked = post.liked_by?.includes(auth.currentUser?.uid || '');
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes_count);

  const handleLike = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const postRef = doc(db, 'posts', post.id);
    
    // Optimistic UI
    setLocalLiked(!localLiked);
    setLocalLikeCount(prev => localLiked ? prev - 1 : prev + 1);

    try {
      if (localLiked) {
        await updateDoc(postRef, {
          liked_by: arrayRemove(uid),
          likes_count: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          liked_by: arrayUnion(uid),
          likes_count: increment(1)
        });

        // Add Notification
        if (post.user_id !== uid) {
          await addDoc(collection(db, 'notifications'), {
            user_id: post.user_id,
            type: 'like',
            triggered_by: uid,
            triggered_by_name: auth.currentUser.displayName || 'Someone',
            post_id: post.id,
            created_at: serverTimestamp(),
            read: false
          });
        }
      }
    } catch (err) {
      // Revert on error
      setLocalLiked(localLiked);
      setLocalLikeCount(localLikeCount);
      console.error(err);
    }
  };

  return (
    <div className="nox-card">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          <img 
            src={post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} 
            className="w-10 h-10 rounded-full bg-background object-cover border border-white/5"
            alt={post.username}
          />
          <div>
            <h4 className="font-semibold text-sm">{post.username || 'User'}</h4>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">
              {post.created_at?.toDate ? formatDistanceToNow(post.created_at.toDate()) : 'just now'} ago
            </span>
          </div>
        </div>
        <button className="text-text-secondary">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square bg-background w-full overflow-hidden">
        <img 
          src={post.image_url} 
          className="w-full h-full object-cover"
          alt="Post content"
          referrerPolicy="no-referrer"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={handleLike}
            className="flex items-center gap-1 group"
          >
            <motion.div
              whileTap={{ scale: 1.4 }}
              animate={{ scale: localLiked ? [1, 1.2, 1] : 1 }}
            >
              <Heart 
                className={cn(
                  "w-7 h-7 transition-colors",
                  localLiked ? "fill-primary text-primary" : "text-text-primary hover:text-primary"
                )} 
              />
            </motion.div>
            <span className="text-sm font-medium">{localLikeCount}</span>
          </button>
          
          <button 
            onClick={() => navigate(`/comments/${post.id}`)}
            className="text-text-primary hover:text-primary transition-colors flex items-center gap-1"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
          
          <button className="text-text-primary hover:text-primary transition-colors ml-auto">
            <Share2 className="w-7 h-7" />
          </button>
        </div>
        
        {/* Caption */}
        <p className="text-sm leading-relaxed">
          <span className="font-bold mr-2">{post.username}</span>
          {post.caption}
        </p>
      </div>
    </div>
  );
};
