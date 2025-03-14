import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Message, Friend } from "@shared/schema";
import { useAuth } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

type WebSocketContextType = {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
};

type WebSocketMessage = {
  type: string;
  payload: any;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      // Close socket when user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
    }

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const connectWebSocket = () => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
      
      // Authenticate the WebSocket connection
      if (user) {
        socket.send(JSON.stringify({
          type: "authenticate",
          payload: { userId: user.id }
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (user) {
          connectWebSocket();
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      socket.close();
    };
  };

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case "message":
        // New message received
        const message = data.payload as Message;
        queryClient.setQueryData(["/api/messages", message.senderId], (oldData: Message[] = []) => 
          [...oldData, message]
        );
        
        // Dispatch a custom event for the message notification
        const messageEvent = new CustomEvent('new-message', { detail: message });
        window.dispatchEvent(messageEvent);
        break;
        
      case "messageSent":
        // Confirmation of sent message
        break;
        
      case "messageStatus":
        // Update status of a message (delivered/read)
        const updatedMessage = data.payload as Message;
        queryClient.setQueryData(["/api/messages", updatedMessage.receiverId], (oldData: Message[] = []) => 
          oldData.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
        break;
        
      case "friendRequest":
        // New friend request received
        const friendRequest = data.payload as Friend;
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        
        // Dispatch a custom event for the friend request notification
        const requestEvent = new CustomEvent('friend-request', { detail: friendRequest });
        window.dispatchEvent(requestEvent);
        break;
        
      case "friendRequestResponse":
        // Friend request was accepted or rejected
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        
        // Dispatch a custom event for the friend request response notification
        const responseEvent = new CustomEvent('friend-request-response', { 
          detail: {
            requestId: data.payload.requestId,
            status: data.payload.status,
            responderId: data.payload.responderId
          } 
        });
        window.dispatchEvent(responseEvent);
        break;
        
      case "friendRequestCancelled":
        // Friend request was cancelled by the sender
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        
        // Dispatch a custom event for the cancellation notification
        const cancellationEvent = new CustomEvent('friend-request-cancelled', { 
          detail: {
            requestId: data.payload.requestId,
            senderId: data.payload.senderId
          } 
        });
        window.dispatchEvent(cancellationEvent);
        break;
        
      case "statusUpdate":
        // Friend's status changed (online/offline)
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        break;
        
      case "typing":
        // Friend is typing
        const { senderId } = data.payload;
        queryClient.setQueryData(["typingUsers"], (oldData: Record<number, boolean> = {}) => ({
          ...oldData,
          [senderId]: true
        }));
        break;
        
      case "stopTyping":
        // Friend stopped typing
        const { senderId: stoppedUserId } = data.payload;
        queryClient.setQueryData(["typingUsers"], (oldData: Record<number, boolean> = {}) => ({
          ...oldData,
          [stoppedUserId]: false
        }));
        break;
    }
  };

  const sendMessage = (type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("WebSocket not connected, can't send message");
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
