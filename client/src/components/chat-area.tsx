import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useFriends } from "@/hooks/use-friends";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  Video, 
  MoreHorizontal, 
  Menu, 
  Paperclip, 
  Smile, 
  Send 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatArea() {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { 
    selectedFriend, 
    messages, 
    isLoading, 
    sendMessage, 
    startTyping, 
    stopTyping, 
    typingUsers
  } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedFriendData = selectedFriend 
    ? friends.find(f => f.friend.id === selectedFriend)?.friend 
    : null;
  
  const isTyping = selectedFriend ? typingUsers[selectedFriend] : false;
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (messageText.trim() && selectedFriend) {
      sendMessage(messageText);
      setMessageText("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const groupMessagesByDate = () => {
    const groups: { [date: string]: typeof messages } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
  };
  
  const getDateDisplay = (dateStr: string) => {
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(messageDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Today";
    } else if (format(messageDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMMM d, yyyy");
    }
  };
  
  if (!selectedFriend) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to ChatConnect</h2>
          <p className="text-gray-500">Select a friend from the list to start chatting</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat header with user info */}
      <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
        <div className="flex items-center">
          <div className="md:hidden mr-2">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {selectedFriendData?.avatar ? (
                <img 
                  src={selectedFriendData.avatar} 
                  alt={selectedFriendData.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {selectedFriendData?.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-1 ring-white ${selectedFriendData?.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{selectedFriendData?.username}</p>
            <p className="text-xs text-gray-500">
              {selectedFriendData?.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-8 w-8 rounded-full mr-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          groupMessagesByDate().map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center justify-center mb-4">
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {getDateDisplay(group.date)}
                </div>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-4">
                {group.messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex items-end ${message.senderId === user?.id ? 'justify-end' : ''}`}
                  >
                    {message.senderId !== user?.id && (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-2">
                        {selectedFriendData?.avatar ? (
                          <img 
                            src={selectedFriendData.avatar} 
                            alt={selectedFriendData.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {selectedFriendData?.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div 
                      className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                        message.senderId === user?.id 
                          ? 'rounded-br-none bg-indigo-600 text-white' 
                          : 'rounded-bl-none bg-white border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex ${message.senderId === user?.id ? 'justify-end' : ''} items-center mt-1`}>
                        <span className={`text-xs ${message.senderId === user?.id ? 'text-indigo-200 mr-1' : 'text-gray-500'}`}>
                          {format(new Date(message.timestamp), "h:mm a")}
                        </span>
                        
                        {message.senderId === user?.id && (
                          <div className="text-indigo-200">
                            {message.status === 'sent' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {message.status === 'delivered' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {message.status === 'read' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-2">
              {selectedFriendData?.avatar ? (
                <img 
                  src={selectedFriendData.avatar} 
                  alt={selectedFriendData.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {selectedFriendData?.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="rounded-lg rounded-bl-none bg-white border p-3">
              <div className="flex space-x-1">
                <div className="w-1 h-1 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1 h-1 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1 h-1 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end">
          <Button variant="ghost" size="icon" className="p-2 mr-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="p-2 mr-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <Smile className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type a message..."
              className="w-full border rounded-full py-2 pl-4 pr-10"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => startTyping()}
              onBlur={() => stopTyping()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
