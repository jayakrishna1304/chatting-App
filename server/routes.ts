import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSockets } from "./websocket";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up HTTP server
  const httpServer = createServer(app);
  
  // Set up authentication
  setupAuth(app);
  
  // Set up WebSockets
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebSockets(wss);
  
  // Friends API endpoints
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const friends = await storage.getFriendsByUserId(req.user.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });
  
  app.post("/api/friends/request", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { username } = req.body;
    
    try {
      const friend = await storage.getUserByUsername(username);
      if (!friend) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (friend.id === req.user.id) {
        return res.status(400).json({ error: "Cannot add yourself as a friend" });
      }
      
      const existingFriend = await storage.getFriendship(req.user.id, friend.id);
      if (existingFriend) {
        return res.status(400).json({ error: "Friend request already exists" });
      }
      
      const friendRequest = await storage.createFriendRequest(req.user.id, friend.id);
      res.status(201).json(friendRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to create friend request" });
    }
  });
  
  app.put("/api/friends/request/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const friendRequest = await storage.getFriendRequest(parseInt(id));
      if (!friendRequest) {
        return res.status(404).json({ error: "Friend request not found" });
      }
      
      if (friendRequest.friendId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this request" });
      }
      
      const updatedRequest = await storage.updateFriendRequest(parseInt(id), status);
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update friend request" });
    }
  });
  
  app.delete("/api/friends/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { id } = req.params;
    
    try {
      const friendship = await storage.getFriendship(req.user.id, parseInt(id)) || 
                         await storage.getFriendship(parseInt(id), req.user.id);
      
      if (!friendship) {
        return res.status(404).json({ error: "Friendship not found" });
      }
      
      await storage.removeFriend(friendship.id);
      res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });
  
  // Messages API endpoints
  app.get("/api/messages/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { friendId } = req.params;
    
    try {
      const messages = await storage.getMessagesBetweenUsers(req.user.id, parseInt(friendId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { receiverId, content } = req.body;
    
    try {
      const message = await storage.createMessage({
        senderId: req.user.id,
        receiverId,
        content,
        status: "sent"
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  app.put("/api/messages/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const message = await storage.getMessageById(parseInt(id));
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this message status" });
      }
      
      const updatedMessage = await storage.updateMessageStatus(parseInt(id), status);
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to update message status" });
    }
  });

  return httpServer;
}
