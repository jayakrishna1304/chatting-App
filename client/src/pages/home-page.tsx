import { WebSocketProvider } from "@/hooks/use-websocket";
import { FriendsProvider } from "@/hooks/use-friends";
import { ChatProvider } from "@/hooks/use-chat";
import LeftSidebar from "@/components/left-sidebar";
import ChatArea from "@/components/chat-area";
import RightSidebar from "@/components/right-sidebar";
import FriendRequestModal from "@/components/friend-request-modal";
import NotificationToast from "@/components/notification-toast";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [notification, setNotification] = useState<any>(null);

  // For demonstration purposes only, in a real app this would come from the WebSocket
  useEffect(() => {
    // Demo notification after 3 seconds
    const notificationTimer = setTimeout(() => {
      setNotification({
        id: 1,
        sender: {
          id: 2,
          username: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        message: "Hey Alex, are you available for a meeting tomorrow?"
      });
      setShowNotification(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }, 3000);
    
    // Demo friend request after 6 seconds
    const requestTimer = setTimeout(() => {
      setPendingRequest({
        id: 1,
        sender: {
          id: 3,
          username: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        message: "Hi Alex! Can we connect?"
      });
      setShowFriendRequest(true);
    }, 6000);
    
    return () => {
      clearTimeout(notificationTimer);
      clearTimeout(requestTimer);
    };
  }, []);

  return (
    <WebSocketProvider>
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
