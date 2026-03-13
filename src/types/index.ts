export interface User {
  id: string;
  email: string;
  nickname: string;
  gender: 'male' | 'female';
  birthYear: number;
  region: string;
  bio: string;
  avatar: string;
  interests: string[];
  coins: number;
  isPremium: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatRoomId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

export interface ChatRoom {
  id: string;
  updatedAt: string;
  members: {
    user: User;
    lastReadAt: string;
  }[];
  messages: Message[];
  _count?: { messages: number };
  unreadCount?: number;
  otherUser?: User;
  lastMessage?: Message;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  fromUser?: User;
  toUser?: User;
}

export interface AuthUser {
  userId: string;
  email: string;
  nickname: string;
}

export interface FilterState {
  gender: 'all' | 'male' | 'female';
  region: string;
  ageMin: number;
  ageMax: number;
}
