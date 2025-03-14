import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { InsertMessage, ServerToClientEvents, ClientToServerEvents } from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
}

export function setupWebSockets(wss: WebSocketServer) {
  // Map to store user connections
  const connections = new Map<number, ExtendedWebSocket>();

  // Handle new connections
  wss.on("connection", (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    // Ping to keep connection alive
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Handle messages from clients
    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);
        const { type, payload } = parsedData;

        // Authentication - associate websocket with user
        if (type === "authenticate" && payload.userId) {
          ws.userId = payload.userId;
          connections.set(payload.userId, ws);
          
          // Update user status
          await storage.updateUserStatus(payload.userId, "online");
          
          // Broadcast online status to friends
          broadcastStatusUpdate(payload.userId, "online");
          
          console.log(`User ${payload.userId} connected`);
        } 
        // Handle messages
        else if (type === "message" && ws.userId) {
          const messageData: InsertMessage = {
            senderId: ws.userId,
            receiverId: payload.receiverId,
            content: payload.content,
            status: "sent"
          };
          
          // Save message to storage
          const savedMessage = await storage.createMessage(messageData);
          
          // Get sender info to include in notification
          const sender = await storage.getUser(ws.userId!);
          
          // Send to receiver if online
          const receiverWs = connections.get(payload.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            // Add sender info to the message for display purposes
            const messageWithSender = {
              ...savedMessage,
              sender: {
                id: sender?.id,
                username: sender?.username,
                avatar: sender?.avatar,
                status: sender?.status
              }
            };
            
            receiverWs.send(JSON.stringify({
              type: "message",
              payload: messageWithSender
            }));
            
            // Update message status to delivered
            const deliveredMessage = await storage.updateMessageStatus(savedMessage.id, "delivered");
            
            // Notify sender that message was delivered
            ws.send(JSON.stringify({
              type: "messageStatus",
              payload: deliveredMessage
            }));
          }
          
          // Send confirmation to sender
          ws.send(JSON.stringify({
            type: "messageSent",
            payload: savedMessage
          }));
        }
        // Handle typing indicators
        else if (type === "typing" && ws.userId) {
          const receiverWs = connections.get(payload.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "typing",
              payload: { senderId: ws.userId }
            }));
          }
        }
        // Handle stop typing indicators
        else if (type === "stopTyping" && ws.userId) {
          const receiverWs = connections.get(payload.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "stopTyping",
              payload: { senderId: ws.userId }
            }));
          }
        }
        // Handle friend requests
        else if (type === "friendRequest" && ws.userId) {
          const friendRequest = await storage.createFriendRequest(ws.userId, payload.friendId);
          
          // Notify the receiver if online
          const receiverWs = connections.get(payload.friendId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "friendRequest",
              payload: friendRequest
            }));
          }
        }
        // Handle friend request responses (accept/reject)
        else if (type === "friendRequestResponse" && ws.userId) {
          const friendRequest = await storage.getFriendRequest(payload.requestId);
          
          if (friendRequest && friendRequest.friendId === ws.userId) {
            // Update the request status
            const updatedRequest = await storage.updateFriendRequest(
              payload.requestId, 
              payload.status // "accepted" or "rejected"
            );
            
            // Notify the original requester if online
            const requesterWs = connections.get(friendRequest.userId);
            if (requesterWs && requesterWs.readyState === WebSocket.OPEN) {
              // Get responder info to include in notification
              const responder = await storage.getUser(ws.userId!);
              
              requesterWs.send(JSON.stringify({
                type: "friendRequestResponse",
                payload: {
                  requestId: payload.requestId,
                  status: payload.status,
                  responderId: ws.userId,
                  responderUsername: responder?.username,
                  responderAvatar: responder?.avatar
                }
              }));
            }
          }
        }
        // Handle cancellation of sent friend requests
        else if (type === "cancelFriendRequest" && ws.userId) {
          const friendRequest = await storage.getFriendRequest(payload.requestId);
          
          if (friendRequest && friendRequest.userId === ws.userId) {
            // Get the receiver before removing the request
            const receiverId = friendRequest.friendId;
            
            // Remove the friend request
            await storage.removeFriend(payload.requestId);
            
            // Notify the receiver of cancellation if online
            const receiverWs = connections.get(receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              // Get sender info to include in cancellation notification
              const sender = await storage.getUser(ws.userId!);
              
              receiverWs.send(JSON.stringify({
                type: "friendRequestCancelled",
                payload: {
                  requestId: payload.requestId,
                  senderId: ws.userId,
                  senderUsername: sender?.username,
                  senderAvatar: sender?.avatar
                }
              }));
            }
          }
        }
        // Handle read receipts
        else if (type === "messageRead" && ws.userId) {
          const message = await storage.getMessageById(payload.messageId);
          if (message && message.receiverId === ws.userId) {
            const updatedMessage = await storage.updateMessageStatus(payload.messageId, "read");
            
            // Notify the sender if online
            const senderWs = connections.get(message.senderId);
            if (senderWs && senderWs.readyState === WebSocket.OPEN) {
              senderWs.send(JSON.stringify({
                type: "messageStatus",
                payload: updatedMessage
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    // Handle disconnection
    ws.on("close", async () => {
      if (ws.userId) {
        // Update user status to offline
        await storage.updateUserStatus(ws.userId, "offline");
        
        // Broadcast offline status to friends
        broadcastStatusUpdate(ws.userId, "offline");
        
        // Remove from connections map
        connections.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected`);
      }
    });
  });

  // Function to broadcast status updates to friends
  async function broadcastStatusUpdate(userId: number, status: string) {
    try {
      const friends = await storage.getFriendsByUserId(userId);
      
      for (const { friend } of friends) {
        const friendWs = connections.get(friend.id);
        if (friendWs && friendWs.readyState === WebSocket.OPEN) {
          friendWs.send(JSON.stringify({
            type: "statusUpdate",
            payload: { userId, status }
          }));
        }
      }
    } catch (error) {
      console.error("Error broadcasting status update:", error);
    }
  }

  // Set up interval to ping clients and check if they're still alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        // Handle timeout for user
        if (ws.userId) {
          storage.updateUserStatus(ws.userId, "offline")
            .then(() => broadcastStatusUpdate(ws.userId!, "offline"))
            .catch(console.error);
          connections.delete(ws.userId);
        }
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Clear interval when server closes
  wss.on("close", () => {
    clearInterval(interval);
  });
}
