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
    };
    
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
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
      
      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    };
    
    // Add event listeners for custom events dispatched by WebSocketProvider
    window.addEventListener('friend-request', handleFriendRequest as EventListener);
    window.addEventListener('new-message', handleNewMessage as EventListener);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('friend-request', handleFriendRequest as EventListener);
      window.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [isConnected, setShowFriendRequest, setPendingRequest, setShowNotification, setNotification]);
  
  return null;
}
