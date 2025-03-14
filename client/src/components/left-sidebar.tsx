import { useAuth } from "@/hooks/use-auth";
import { useFriends } from "@/hooks/use-friends";
import { useChat } from "@/hooks/use-chat";
import { useState } from "react";
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Settings, 
  Search, 
  LogOut, 
  Plus, 
  X
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeftSidebar() {
  const { user, logoutMutation } = useAuth();
  const { friends, isLoading, sendFriendRequest, isPendingAction } = useFriends();
  const { selectFriend, selectedFriend } = useChat();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  
  const pendingRequests = friends.filter(f => f.status === "pending");
  
  const filteredFriends = friends.filter(f => 
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
  };
  
  return (
    <div className="w-20 md:w-64 bg-indigo-900 text-white flex flex-col">
      {/* App logo and name */}
      <div className="h-16 flex items-center justify-center md:justify-start px-4 border-b border-indigo-800">
        <div className="h-8 w-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">C</div>
        <h1 className="hidden md:block ml-2 font-bold text-xl">ChatConnect</h1>
      </div>
      
      {/* Navigation */}
      <nav className="p-2 md:p-4">
        <ul className="space-y-2">
          <li>
            <Button variant="ghost" className="w-full flex items-center justify-center md:justify-start p-2 rounded-lg bg-indigo-800 text-white hover:bg-indigo-700">
              <MessageSquare className="h-6 w-6" />
              <span className="hidden md:block ml-3">Chats</span>
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full flex items-center justify-center md:justify-start p-2 rounded-lg text-indigo-300 hover:bg-indigo-800 hover:text-white">
              <Users className="h-6 w-6" />
              <span className="hidden md:block ml-3">Friends</span>
              {pendingRequests.length > 0 && (
                <Badge className="hidden md:flex ml-auto bg-red-500 text-white">{pendingRequests.length}</Badge>
              )}
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full flex items-center justify-center md:justify-start p-2 rounded-lg text-indigo-300 hover:bg-indigo-800 hover:text-white">
              <Bell className="h-6 w-6" />
              <span className="hidden md:block ml-3">Notifications</span>
              <Badge className="hidden md:flex ml-auto bg-red-500 text-white">5</Badge>
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full flex items-center justify-center md:justify-start p-2 rounded-lg text-indigo-300 hover:bg-indigo-800 hover:text-white">
              <Settings className="h-6 w-6" />
              <span className="hidden md:block ml-3">Settings</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      {/* Friend list section */}
      <div className="mt-6 px-2 md:px-4 overflow-y-auto flex-grow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm md:text-base text-indigo-200">FRIENDS</h2>
          <Button
            size="icon"
            variant="ghost"
            className="p-1 rounded-full bg-indigo-800 text-white hover:bg-indigo-700"
            onClick={() => setAddFriendOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search friends */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search friends..."
            className="w-full bg-indigo-800 text-white text-sm rounded-lg pl-8 pr-4 py-2 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-indigo-400" />
        </div>
        
        {/* Friend list */}
        <div className="space-y-1 md:space-y-2">
          {isLoading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="hidden md:block ml-3 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <Button
                key={friend.friend.id}
                variant="ghost"
                className={`w-full flex items-center p-2 rounded-lg hover:bg-indigo-800 transition text-left ${
                  selectedFriend === friend.friend.id ? 'bg-indigo-800' : ''
                }`}
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
                <div className="hidden md:block ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{friend.friend.username}</p>
                  <p className="text-xs text-indigo-300 truncate">
                    {friend.friend.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center p-4 text-indigo-300 text-sm">
              {searchTerm ? "No friends match your search" : "No friends yet. Add someone!"}
            </div>
          )}
        </div>
      </div>
      
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
      
      {/* Add friend dialog */}
      <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new friend</DialogTitle>
            <DialogDescription>
              Enter the username of the person you want to add as a friend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Username"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFriendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFriend} disabled={isPendingAction || !newFriendUsername.trim()}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
