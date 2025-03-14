import { WebSocketProvider } from "@/hooks/use-websocket";
import { FriendsProvider } from "@/hooks/use-friends";
import { ChatProvider } from "@/hooks/use-chat";
import LeftSidebar from "@/components/left-sidebar";
import ChatArea from "@/components/chat-area";
import RightSidebar from "@/components/right-sidebar";
import FriendRequestModal from "@/components/friend-request-modal";
import NotificationToast from "@/components/notification-toast";
import { useState, useEffect } from "react";
import { Friend, Message } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

export default function HomePage() {
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [notification, setNotification] = useState<any>(null);

  // WebSocket provider for real-time updates
  return (
    <WebSocketProvider>
      <WebSocketHandler 
        setShowFriendRequest={setShowFriendRequest}
        setPendingRequest={setPendingRequest}
        setShowNotification={setShowNotification}
        setNotification={setNotification}
      />
      <FriendsProvider>
        <ChatProvider>
          <div className="flex h-screen overflow-hidden">
            <LeftSidebar />
            <ChatArea />
            <RightSidebar />
          </div>
          
          {showFriendRequest && pendingRequest && (
            <FriendRequestModal
              request={pendingRequest}
              onClose={() => setShowFriendRequest(false)}
              onAccept={() => setShowFriendRequest(false)}
              onDecline={() => setShowFriendRequest(false)}
            />
          )}
          
          {showNotification && notification && (
            <NotificationToast
              notification={notification}
              onClose={() => setShowNotification(false)}
            />
          )}
        </ChatProvider>
      </FriendsProvider>
    </WebSocketProvider>
  );
}

// Separate component to handle WebSocket events
function WebSocketHandler({
  setShowFriendRequest,
  setPendingRequest,
  setShowNotification,
  setNotification
}: {
  setShowFriendRequest: (show: boolean) => void;
  setPendingRequest: (request: any) => void;
  setShowNotification: (show: boolean) => void;
  setNotification: (notification: any) => void;
}) {
  const { isConnected } = useWebSocket();
  
  useEffect(() => {
    // Listen for WebSocket events from the WebSocketProvider
    const handleFriendRequest = (event: CustomEvent) => {
      const request = event.detail;
      setPendingRequest(request);
      setShowFriendRequest(true);
      
      // Play a notification sound for friend requests
      const audio = new Audio("/message-notification.mp3");
      audio.volume = 0.6; // Slightly louder than chat notifications
      audio.play().catch(err => console.log("Could not play friend request notification sound", err));
    };
    
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      // Enhanced notification with better sender info
      setNotification({
        id: message.id,
        sender: {
          id: message.senderId,
          username: message.sender?.username || "Unknown User",
          avatar: message.sender?.avatar
        },
        message: message.content
      });
      setShowNotification(true);
      
      // Play a notification sound
      const audio = new Audio("/message-notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Could not play notification sound", err));
      
      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    };
    
    const handleFriendRequestResponse = (event: CustomEvent) => {
      const { status, responderId, responderUsername } = event.detail;
      const responseText = status === "accepted" 
        ? "accepted your friend request!" 
        : "declined your friend request";
      
      setNotification({
        id: Date.now(),
        sender: {
          id: responderId,
          username: responderUsername || "Friend Update",
          avatar: event.detail.responderAvatar
        },
        message: `${responderUsername || "Someone"} ${responseText}`
      });
      setShowNotification(true);
      
      // Play notification sound
      const audio = new Audio("/message-notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Could not play notification sound", err));
      
      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    };
    
    const handleFriendRequestCancelled = (event: CustomEvent) => {
      const { senderId, senderUsername } = event.detail;
      
      setNotification({
        id: Date.now(),
        sender: {
          id: senderId,
          username: senderUsername || "Friend Update",
          avatar: event.detail.senderAvatar
        },
        message: `${senderUsername || "Someone"} cancelled their friend request`
      });
      setShowNotification(true);
      
      // Play notification sound
      const audio = new Audio("/message-notification.mp3");
      audio.volume = 0.4; // Slightly quieter for cancellations
      audio.play().catch(err => console.log("Could not play notification sound", err));
      
      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    };
    
    // Add event listeners for custom events dispatched by WebSocketProvider
    window.addEventListener('friend-request', handleFriendRequest as EventListener);
    window.addEventListener('new-message', handleNewMessage as EventListener);
    window.addEventListener('friend-request-response', handleFriendRequestResponse as EventListener);
    window.addEventListener('friend-request-cancelled', handleFriendRequestCancelled as EventListener);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('friend-request', handleFriendRequest as EventListener);
      window.removeEventListener('new-message', handleNewMessage as EventListener);
      window.removeEventListener('friend-request-response', handleFriendRequestResponse as EventListener);
      window.removeEventListener('friend-request-cancelled', handleFriendRequestCancelled as EventListener);
    };
  }, [isConnected, setShowFriendRequest, setPendingRequest, setShowNotification, setNotification]);
  
  return null;
}
