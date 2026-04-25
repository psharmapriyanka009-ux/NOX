export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  bio: string;
  profile_pic: string;
  followers_count: number;
  following_count: number;
  followers?: string[];
  following?: string[];
  created_at: any; // Firestore Timestamp
}

export interface Post {
  id: string;
  user_id: string;
  username?: string; // Denormalized for display
  user_avatar?: string; // Denormalized for display
  image_url: string;
  caption: string;
  likes_count: number;
  liked_by?: string[];
  created_at: any; // Firestore Timestamp
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  text: string;
  created_at: any;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'follow' | 'comment';
  triggered_by: string;
  triggered_by_name: string;
  post_id?: string;
  created_at: any;
  read: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  media_url: string;
  created_at: any;
  expires_at: any;
  viewers: string[];
}

export interface Reel {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  video_url: string;
  caption: string;
  likes_count: number;
  liked_by: string[];
  created_at: any;
}
