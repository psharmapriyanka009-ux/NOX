import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Comment, Post } from '../types';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function CommentsScreen() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!postId) return;

    // Fetch Post Details
    getDoc(doc(db, 'posts', postId)).then(s => {
      if (s.exists()) setPost({ id: s.id, ...s.data() } as Post);
    });

    const q = query(
      collection(db, 'comments'),
      where('post_id', '==', postId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'comments'));

    return unsubscribe;
  }, [postId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId || !profile || !auth.currentUser) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'comments'), {
        post_id: postId,
        user_id: auth.currentUser.uid,
        username: profile.username,
        user_avatar: profile.profile_pic,
        text: newComment.trim(),
        created_at: serverTimestamp()
      });

      // Notify post owner
      if (post && post.user_id !== auth.currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          user_id: post.user_id,
          type: 'comment',
          triggered_by: auth.currentUser.uid,
          triggered_by_name: profile.username,
          post_id: postId,
          created_at: serverTimestamp(),
          read: false
        });
      }

      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5 bg-background sticky top-0 z-10">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-display font-bold text-xl">Comments</h2>
      </div>

      {/* Post Context */}
      {post && (
        <div className="p-6 border-b border-white/5 flex gap-4">
          <img src={post.user_avatar} className="w-10 h-10 rounded-full" alt="" />
          <div>
            <p className="text-sm">
              <span className="font-bold mr-2">{post.username}</span>
              {post.caption}
            </p>
            <span className="text-[10px] text-text-secondary uppercase mt-1 block">
              POST FOUNDATION
            </span>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">No comments yet</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.user_avatar} className="w-10 h-10 rounded-full bg-surface" alt="" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{comment.username}</span>
                  <span className="text-[10px] text-text-secondary">
                    {comment.created_at?.toDate ? formatDistanceToNow(comment.created_at.toDate()) : 'just now'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-text-primary/90">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-background border-t border-white/5 fixed bottom-0 left-0 right-0 max-w-2xl mx-auto flex items-center gap-3">
        <img src={profile?.profile_pic} className="w-8 h-8 rounded-full border border-white/10" alt="" />
        <input 
          type="text" 
          placeholder="Add a comment..."
          className="flex-1 nox-input py-2 text-sm"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button 
          disabled={!newComment.trim() || sending}
          className="text-primary font-bold text-sm px-2 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
        </button>
      </form>
    </div>
  );
}
