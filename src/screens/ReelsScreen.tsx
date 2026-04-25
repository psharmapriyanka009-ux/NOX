import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Reel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Music2, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function ReelsScreen() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'reels'), orderBy('created_at', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reel[];
      setReels(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="h-[calc(100vh-70px)] bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
    </div>
  );

  return (
    <div 
      className="h-[calc(100vh-70px)] overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
      ref={scrollRef}
    >
      {reels.map((reel) => (
        <ReelItem key={reel.id} reel={reel} muted={muted} setMuted={setMuted} />
      ))}
      
      {reels.length === 0 && (
        <div className="h-full flex items-center justify-center text-text-secondary">
          No reels yet. Share your first one!
        </div>
      )}
    </div>
  );
}

function ReelItem({ reel, muted, setMuted }: { reel: Reel, muted: boolean, setMuted: (m: boolean) => void }) {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(reel.liked_by?.includes(auth.currentUser?.uid || ''));
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    }, { threshold: 0.7 });

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLike = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const reelRef = doc(db, 'reels', reel.id);

    setLocalLiked(!localLiked);
    setLikesCount(prev => localLiked ? prev - 1 : prev + 1);

    try {
      if (localLiked) {
        await updateDoc(reelRef, { liked_by: arrayRemove(uid), likes_count: increment(-1) });
      } else {
        await updateDoc(reelRef, { liked_by: arrayUnion(uid), likes_count: increment(1) });
      }
    } catch (err) {
      setLocalLiked(localLiked);
      setLikesCount(likesCount);
    }
  };

  return (
    <div className="h-full w-full relative snap-start overflow-hidden bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        onClick={() => setMuted(!muted)}
      />

      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
        <div className="flex flex-col items-center gap-1">
          <button onClick={handleLike} className="p-2 pointer-events-auto">
            <motion.div whileTap={{ scale: 1.5 }}>
              <Heart className={cn("w-8 h-8 transition-colors", localLiked ? "fill-primary text-primary" : "text-white")} />
            </motion.div>
          </button>
          <span className="text-white text-xs font-bold">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={() => navigate(`/comments/${reel.id}`)} className="p-2 pointer-events-auto">
            <MessageCircle className="w-8 h-8 text-white" />
          </button>
          <span className="text-white text-xs font-bold">0</span>
        </div>

        <button className="p-2 pointer-events-auto">
          <Share2 className="w-8 h-8 text-white" />
        </button>

        <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-surface pointer-events-auto" onClick={() => navigate(`/profile/${reel.user_id}`)}>
          <img src={reel.user_avatar} className="w-full h-full object-cover" alt="" />
        </div>
      </div>

      {/* Info */}
      <div className="absolute left-4 bottom-24 right-16 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-3 pointer-events-auto" onClick={() => navigate(`/profile/${reel.user_id}`)}>
          <span className="font-bold text-white text-sm">@{reel.username}</span>
          <button className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
            Follow
          </button>
        </div>
        <p className="text-white text-sm mb-4 line-clamp-2">{reel.caption}</p>
        <div className="flex items-center gap-2 text-white/80">
          <Music2 className="w-4 h-4" />
          <span className="text-xs">Original Audio - {reel.username}</span>
        </div>
      </div>

      {/* Mute Indicator */}
      <AnimatePresence>
        {muted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 p-4 rounded-full"
          >
            <VolumeX className="w-8 h-8 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
