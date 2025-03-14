import { useAuth } from "@/hooks/use-auth";
import { useFriends } from "@/hooks/use-friends";
import { useChat } from "@/hooks/use-chat";
import { useState } from "react";
import { 
  MessageSquare, 
  Users, 
  UserPlus,
  Bell, 
  Settings, 
  Search, 
  LogOut, 
  Plus, 
  X,
  UserCheck,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeftSidebar() {
  const { user, logoutMutation } = useAuth();
  const { friends, isLoading, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, isPendingAction } = useFriends();
  const { selectFriend, selectedFriend } = useChat();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  
  // Get pending friend requests
  const pendingRequests = friends.filter(f => f.status === "pending" && f.userId !== user?.id);
  const sentRequests = friends.filter(f => f.status === "pending" && f.userId === user?.id);
  
  // Filter friends by search term and accepted status
  const acceptedFriends = friends.filter(f => 
    f.status === "accepted" && 
    f.friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddFriend = () => {
    if (newFriendUsername.trim()) {
      sendFriendRequest(newFriendUsername);
      setNewFriendUsername("");
      setAddFriendOpen(false);
    }
  };
  
  const handleFriendClick = (friendId: number) => {
    selectFriend(friendId);
    // If on mobile, switch to chats tab when selecting a friend
    if (window.innerWidth < 768) {
      setActiveTab("chats");
    }
  };
  
  return (
    <div className="w-20 md:w-64 bg-indigo-900 text-white flex flex-col">
      {/* App logo and name */}
      <div className="h-16 flex items-center justify-center md:justify-start px-4 border-b border-indigo-800">
        <div className="h-8 w-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">C</div>
        <h1 className="hidden md:block ml-2 font-bold text-xl">ChatConnect</h1>
      </div>
      
      {/* Navigation Tabs - More Facebook-like */}
      <Tabs defaultValue="chats" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 p-0 bg-transparent border-b border-indigo-800">
          <TabsTrigger 
            value="chats" 
            className="data-[state=active]:bg-indigo-800 data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-white"
          >
            <div className="flex flex-col items-center justify-center py-2">
              <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden md:inline text-xs mt-1">Chats</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="friends" 
            className="data-[state=active]:bg-indigo-800 data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-white flex items-center justify-center relative"
          >
            <div className="flex flex-col items-center justify-center py-2">
              <Users className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden md:inline text-xs mt-1">Friends</span>
              {pendingRequests.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                  {pendingRequests.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="add" 
            className="data-[state=active]:bg-indigo-800 data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-white"
          >
            <div className="flex flex-col items-center justify-center py-2">
              <UserPlus className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden md:inline text-xs mt-1">Add Friends</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Chat List Content */}
        <TabsContent value="chats" className="flex-grow overflow-y-auto px-2 md:px-4 mt-0">
          <div className="relative my-4">
            <Input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-indigo-800 text-white text-sm rounded-lg pl-8 pr-4 py-2 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-indigo-400" />
          </div>
          
          {/* Chat list */}
          <div className="space-y-1 md:space-y-2">
            {isLoading ? (
              // Loading skeleton
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3 space-y-1 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))
            ) : acceptedFriends.length > 0 ? (
              acceptedFriends.map((friend) => (
                <Button
                  key={friend.friend.id}
                  variant="ghost"
                  className={`w-full flex items-center p-2 rounded-lg hover:bg-indigo-800 transition text-left ${
                    selectedFriend === friend.friend.id ? 'bg-indigo-800' : ''
                  }`}
                  onClick={() => handleFriendClick(friend.friend.id)}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {friend.friend.avatar ? (
                        <img 
                          src={friend.friend.avatar} 
                          alt={friend.friend.username} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-800">
                          {friend.friend.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span 
                      className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-1 ring-white ${
                        friend.friend.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    ></span>
                  </div>
                  <div className="ml-3 overflow-hidden flex-1">
                    <p className="text-sm font-medium text-white truncate">{friend.friend.username}</p>
                    <p className="text-xs text-indigo-300 truncate">
                      {friend.friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center p-8 text-indigo-300">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Add friends to start chatting</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 border-indigo-400 text-indigo-300 hover:bg-indigo-800 hover:text-white"
                  onClick={() => setActiveTab("add")}
                >
                  Find Friends
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Friends Content with Friend Requests */}
        <TabsContent value="friends" className="flex-grow overflow-y-auto px-2 md:px-4 mt-0">
          {/* Friend Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-indigo-200 mb-2">FRIEND REQUESTS ({pendingRequests.length})</h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-indigo-800/50 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {request.friend.avatar ? (
                          <img 
                            src={request.friend.avatar} 
                            alt={request.friend.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">
                            {request.friend.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">{request.friend.username}</p>
                        <p className="text-xs text-indigo-300">Wants to be your friend</p>
                      </div>
                    </div>
                    <div className="flex mt-3 space-x-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => acceptFriendRequest(request.id)}
                        disabled={isPendingAction}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => rejectFriendRequest(request.id)}
                        disabled={isPendingAction}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Pending Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-indigo-200 mb-2">SENT REQUESTS ({sentRequests.length})</h3>
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div key={request.id} className="bg-indigo-800/30 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {request.friend.avatar ? (
                          <img 
                            src={request.friend.avatar} 
                            alt={request.friend.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">
                            {request.friend.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">{request.friend.username}</p>
                        <p className="text-xs text-indigo-300">Request pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Your Friends Section */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-indigo-200 mb-2">YOUR FRIENDS ({acceptedFriends.length})</h3>
            {acceptedFriends.length > 0 ? (
              <div className="space-y-2">
                {acceptedFriends.map((friend) => (
                  <Button
                    key={friend.friend.id}
                    variant="ghost"
                    className="w-full flex items-center justify-start p-2 rounded-lg hover:bg-indigo-800 transition"
                    onClick={() => handleFriendClick(friend.friend.id)}
                  >
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {friend.friend.avatar ? (
                          <img 
                            src={friend.friend.avatar} 
                            alt={friend.friend.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">
                            {friend.friend.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span 
                        className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-1 ring-white ${
                          friend.friend.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      ></span>
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{friend.friend.username}</p>
                      <p className="text-xs text-indigo-300 truncate">
                        {friend.friend.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-indigo-300 text-sm">
                No friends yet. Find people to connect with!
              </div>
            )}
          </div>
          
          {/* Find Friends Button */}
          <div className="text-center my-4">
            <Button 
              variant="outline" 
              className="w-full border-indigo-400 text-indigo-300 hover:bg-indigo-800 hover:text-white"
              onClick={() => setActiveTab("add")}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Find More Friends
            </Button>
          </div>
        </TabsContent>
        
        {/* Add Friends Content */}
        <TabsContent value="add" className="flex-grow overflow-y-auto px-2 md:px-4 mt-0">
          <div className="my-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Friends</h3>
            <p className="text-sm text-indigo-300 mb-4">
              Connect with people by entering their username below.
            </p>
            
            <div className="bg-indigo-800/30 rounded-lg p-4">
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Enter Username
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Username to add"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  className="flex-1 bg-indigo-800/60 border-indigo-700 text-white placeholder:text-indigo-400"
                />
                <Button 
                  onClick={handleAddFriend} 
                  disabled={isPendingAction || !newFriendUsername.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-indigo-200 mb-3">Tips for Finding Friends</h4>
              <ul className="text-xs text-indigo-300 space-y-2">
                <li className="flex items-start">
                  <span className="h-5 w-5 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">1</span>
                  Make sure you're entering the exact username
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">2</span>
                  Ask your friends to register on ChatConnect
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">3</span>
                  Check your pending requests in the Friends tab
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* User profile */}
      <div className="mt-auto p-2 md:p-4 border-t border-indigo-800">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:block ml-3">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
              <p className="text-xs text-indigo-300">Online</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-indigo-300 hover:text-white"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
