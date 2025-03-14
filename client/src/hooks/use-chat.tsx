import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";
import { useWebSocket } from "./use-websocket";

type ChatContextType = {
  selectedFriend: number | null;
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => void;
  selectFriend: (friendId: number) => void;
  markAsRead: (messageId: number) => void;
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: Record<number, boolean>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage: sendWsMessage } = useWebSocket();
  
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  
  const {
    data: messages = [],
    error,
    isLoading,
  } = useQuery<Message[], Error>({
    queryKey: ["/api/messages", selectedFriend],
    enabled: !!user && !!selectedFriend,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", { receiverId, content });
      return await res.json();
    },
    onSuccess: (newMessage) => {
      // Optimistically update the messages list
      queryClient.setQueryData(["/api/messages", selectedFriend], (oldData: Message[] = []) => 
        [...oldData, newMessage]
      );
      
      // Send via WebSocket
      if (sendWsMessage) {
        sendWsMessage("message", {
          receiverId: newMessage.receiverId,
          content: newMessage.content
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/status`, { status: "read" });
      return await res.json();
    },
    onSuccess: (updatedMessage) => {
      // Optimistically update the message status
      queryClient.setQueryData(["/api/messages", selectedFriend], (oldData: Message[] = []) => 
        oldData.map(message => 
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
      
      // Notify via WebSocket
      if (sendWsMessage) {
        sendWsMessage("messageRead", { messageId: updatedMessage.id });
      }
    },
  });

  // Listen for new messages to show notifications
  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message: Message = customEvent.detail;
      
      // Show notification only if the message is not from the current user
      // and not from the currently selected friend
      if (user && message.senderId !== user.id && message.senderId !== selectedFriend) {
        toast({
          title: "New message",
          description: `${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`,
          variant: "default",
          action: (
            <button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded px-2 py-1 text-xs"
              onClick={() => selectFriend(message.senderId)}
            >
              View
            </button>
          )
        });
      }
    };
    
    window.addEventListener('new-message', handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [user, selectedFriend, toast]);

  const selectFriend = (friendId: number) => {
    setSelectedFriend(friendId);
  };

  const sendMessage = (content: string) => {
    if (selectedFriend && content.trim()) {
      sendMessageMutation.mutate({ receiverId: selectedFriend, content });
    }
  };

  const markAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  const startTyping = () => {
    if (selectedFriend && sendWsMessage) {
      sendWsMessage("typing", { receiverId: selectedFriend });
    }
  };

  const stopTyping = () => {
    if (selectedFriend && sendWsMessage) {
      sendWsMessage("stopTyping", { receiverId: selectedFriend });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        selectedFriend,
        messages,
        isLoading,
        error,
        sendMessage,
        selectFriend,
        markAsRead,
        isTyping: sendMessageMutation.isPending,
        startTyping,
        stopTyping,
        typingUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
