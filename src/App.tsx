import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import AddPostScreen from './screens/AddPostScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import ReelsScreen from './screens/ReelsScreen';
import StoryViewerScreen from './screens/StoryViewerScreen';
import CommentsScreen from './screens/CommentsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AddReelScreen from './screens/AddReelScreen';
import AddStoryScreen from './screens/AddStoryScreen';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/explore" element={<SearchScreen />} />
            <Route path="/reels" element={<ReelsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/:userId" element={<ProfileScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
          </Route>
          
          <Route path="/story/:userId" element={<PrivateRoute><StoryViewerScreen /></PrivateRoute>} />
          <Route path="/comments/:postId" element={<PrivateRoute><CommentsScreen /></PrivateRoute>} />
          <Route path="/add-post" element={<PrivateRoute><AddPostScreen /></PrivateRoute>} />
          <Route path="/add-reel" element={<PrivateRoute><AddReelScreen /></PrivateRoute>} />
          <Route path="/add-story" element={<PrivateRoute><AddStoryScreen /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
