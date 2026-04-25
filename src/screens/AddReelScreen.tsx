import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Video, Loader2, X } from 'lucide-react';

export default function AddReelScreen() {
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!video || !profile) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `reels/${auth.currentUser?.uid}/${Date.now()}_${video.name}`);
      await uploadBytes(storageRef, video);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'reels'), {
        user_id: auth.currentUser?.uid,
        username: profile.username,
        user_avatar: profile.profile_pic,
        video_url: url,
        caption,
        likes_count: 0,
        liked_by: [],
        created_at: serverTimestamp()
      });

      navigate('/reels');
    } catch (err) {
      console.error(err);
      alert('Failed to share reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-display font-bold text-xl">New Reel</h2>
        <button 
          onClick={handleUpload} 
          disabled={!video || loading}
          className="text-primary font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
        </button>
      </div>

      <div className="px-6 mt-8">
        {!preview ? (
          <label className="aspect-[9/16] w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-surface">
            <Video className="w-12 h-12 text-text-secondary mb-4" />
            <span className="text-text-secondary font-medium">Select a video</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
          </label>
        ) : (
          <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/10">
            <video src={preview} className="w-full h-full object-cover" controls />
            <button 
              onClick={() => { setPreview(null); setVideo(null); }}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mt-8">
          <textarea
            placeholder="Write a caption for your reel..."
            className="w-full bg-transparent text-text-primary placeholder:text-text-secondary border-none focus:ring-0 resize-none min-h-[100px] text-lg"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
