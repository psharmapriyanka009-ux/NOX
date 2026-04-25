import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function AddPostScreen() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
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

  const handlePost = async () => {
    if (!image || !profile) return;
    setLoading(true);
    try {
      // 1. Upload Image
      const storageRef = ref(storage, `posts/${auth.currentUser?.uid}/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);

      // 2. Save to Firestore
      const path = 'posts';
      try {
        await addDoc(collection(db, path), {
          user_id: auth.currentUser?.uid,
          username: profile.username,
          user_avatar: profile.profile_pic,
          image_url: url,
          caption,
          likes_count: 0,
          created_at: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-10">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-display font-bold text-xl">New Post</h2>
        <button 
          onClick={handlePost} 
          disabled={!image || loading}
          className="text-primary font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
        </button>
      </div>

      <div className="px-6 mt-8">
        {/* Image Selector */}
        {!preview ? (
          <label className="aspect-square w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-surface">
            <ImageIcon className="w-12 h-12 text-text-secondary mb-4" />
            <span className="text-text-secondary font-medium">Select a photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        ) : (
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 group">
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
            <button 
              onClick={() => { setPreview(null); setImage(null); }}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Caption */}
        <div className="mt-8">
          <textarea
            placeholder="Write a caption..."
            className="w-full bg-transparent text-text-primary placeholder:text-text-secondary border-none focus:ring-0 resize-none min-h-[120px] text-lg"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
