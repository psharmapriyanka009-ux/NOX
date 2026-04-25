import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function AddStoryScreen() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image || !profile) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `stories/${auth.currentUser?.uid}/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);

      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      await addDoc(collection(db, 'stories'), {
        user_id: auth.currentUser?.uid,
        username: profile.username,
        user_avatar: profile.profile_pic,
        media_url: url,
        created_at: serverTimestamp(),
        expires_at: expires,
        viewers: []
      });

      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Failed to share story');
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
        <h2 className="font-display font-bold text-xl">New Story</h2>
        <button 
          onClick={handleUpload} 
          disabled={!image || loading}
          className="text-primary font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
        </button>
      </div>

      <div className="px-6 mt-8">
        {!preview ? (
          <label className="aspect-[9/16] w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-surface">
            <ImageIcon className="w-12 h-12 text-text-secondary mb-4" />
            <span className="text-text-secondary font-medium">Select a photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        ) : (
          <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/10">
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
            <button 
              onClick={() => { setPreview(null); setImage(null); }}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
