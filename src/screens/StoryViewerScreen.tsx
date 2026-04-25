import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Story } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function StoryViewerScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('user_id', '==', userId),
      where('expires_at', '>', now),
      orderBy('expires_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
      if (data.length === 0) {
        navigate('/home');
        return;
      }
      setStories(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0 && auth.currentUser) {
      const currentStory = stories[currentIndex];
      if (!currentStory.viewers.includes(auth.currentUser.uid)) {
        updateDoc(doc(db, 'stories', currentStory.id), {
          viewers: arrayUnion(auth.currentUser.uid)
        });
      }
    }
  }, [currentIndex, stories]);

  useEffect(() => {
    if (loading || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds total

    return () => clearInterval(interval);
  }, [currentIndex, stories, loading]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      navigate('/home');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      navigate('/home');
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
    </div>
  );

  const current = stories[currentIndex];

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={current.user_avatar} className="w-10 h-10 rounded-full border border-white/20" alt="" />
          <span className="font-bold text-white shadow-lg">{current.username}</span>
        </div>
        <button onClick={() => navigate('/home')} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={current.media_url} 
            className="w-full h-full object-cover" 
            alt="Story content"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 h-full cursor-west-resize" onClick={handlePrev} />
        <div className="flex-1 h-full cursor-east-resize" onClick={handleNext} />
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none md:block hidden">
        <ChevronLeft className="w-8 h-8 text-white opacity-50" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none md:block hidden">
        <ChevronRight className="w-8 h-8 text-white opacity-50" />
      </div>
    </div>
  );
}
