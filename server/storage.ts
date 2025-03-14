import { users, friends, messages, type User, type InsertUser, type Friend, type Message, type InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;
  
  // Friend operations
  getFriendsByUserId(userId: number): Promise<{friend: User, status: string}[]>;
  getFriendship(userId: number, friendId: number): Promise<Friend | undefined>;
  createFriendRequest(userId: number, friendId: number): Promise<Friend>;
  getFriendRequest(id: number): Promise<Friend | undefined>;
  updateFriendRequest(id: number, status: string): Promise<Friend | undefined>;
  removeFriend(id: number): Promise<void>;
  
  // Message operations
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: number, status: string): Promise<Message | undefined>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friendships: Map<number, Friend>;
  private messageStore: Map<number, Message>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentFriendshipId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.friendships = new Map();
    this.messageStore = new Map();
    this.currentUserId = 1;
    this.currentFriendshipId = 1;
    this.currentMessageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      status: "online", 
      lastSeen: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { 
        ...user, 
        status, 
        lastSeen: status === "offline" ? new Date() : user.lastSeen 
      };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  // Friend operations
  async getFriendsByUserId(userId: number): Promise<{ friend: User, status: string }[]> {
    const userFriendships = Array.from(this.friendships.values()).filter(
      friendship => 
        (friendship.userId === userId || friendship.friendId === userId) && 
        friendship.status === "accepted"
    );
    
    const pendingRequests = Array.from(this.friendships.values()).filter(
      friendship => 
        friendship.friendId === userId && 
        friendship.status === "pending"
    );
    
    const result = [];
    
    // Add accepted friends
    for (const friendship of userFriendships) {
      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
      const friend = this.users.get(friendId);
      if (friend) {
        result.push({ friend, status: "accepted" });
      }
    }
    
    // Add pending requests
    for (const request of pendingRequests) {
      const requester = this.users.get(request.userId);
      if (requester) {
        result.push({ friend: requester, status: "pending" });
      }
    }
    
    return result;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friend | undefined> {
    return Array.from(this.friendships.values()).find(
      friendship => 
        (friendship.userId === userId && friendship.friendId === friendId) ||
        (friendship.userId === friendId && friendship.friendId === userId)
    );
  }

  async createFriendRequest(userId: number, friendId: number): Promise<Friend> {
    const id = this.currentFriendshipId++;
    const now = new Date();
    const friendship: Friend = {
      id,
      userId,
      friendId,
      status: "pending",
      createdAt: now
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async getFriendRequest(id: number): Promise<Friend | undefined> {
    return this.friendships.get(id);
  }

  async updateFriendRequest(id: number, status: string): Promise<Friend | undefined> {
    const request = this.friendships.get(id);
    if (request) {
      const updatedRequest = { ...request, status };
      this.friendships.set(id, updatedRequest);
      return updatedRequest;
    }
    return undefined;
  }

  async removeFriend(id: number): Promise<void> {
    this.friendships.delete(id);
  }

  // Message operations
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messageStore.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messageStore.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { ...insertMessage, id, timestamp: now };
    this.messageStore.set(id, message);
    return message;
  }

  async updateMessageStatus(id: number, status: string): Promise<Message | undefined> {
    const message = this.messageStore.get(id);
    if (message) {
      const updatedMessage = { ...message, status };
      this.messageStore.set(id, updatedMessage);
      return updatedMessage;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
