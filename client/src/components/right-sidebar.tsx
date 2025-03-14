import { useChat } from "@/hooks/use-chat";
import { useFriends } from "@/hooks/use-friends";
import { useState } from "react";
import { 
  Phone, 
  Video, 
  Search, 
  MoreHorizontal, 
  FileText, 
  BarChart, 
  Archive, 
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RightSidebar() {
  const { selectedFriend } = useChat();
  const { friends } = useFriends();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showTypingEnabled, setShowTypingEnabled] = useState(true);
  
  const selectedFriendData = selectedFriend 
    ? friends.find(f => f.friend.id === selectedFriend)?.friend 
    : null;
  
  if (!selectedFriend || !selectedFriendData) {
    return null;
  }
  
  return (
    <div className="hidden lg:block w-64 border-l bg-white">
      <div className="p-4 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mb-3">
          {selectedFriendData.avatar ? (
            <img 
              src={selectedFriendData.avatar} 
              alt={selectedFriendData.username} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl font-semibold text-gray-800">
              {selectedFriendData.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="font-bold text-gray-900 text-lg">{selectedFriendData.username}</h2>
        <p className="text-sm text-gray-500 flex items-center">
          <span className={`h-2 w-2 rounded-full mr-1 ${selectedFriendData.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
          {selectedFriendData.status === 'online' ? 'Online' : 'Offline'}
        </p>
        
        <div className="mt-6 w-full">
          <div className="flex justify-around">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <Phone className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Call</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <Video className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Video call</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search in conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* User info */}
      <div className="p-4 border-t">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Info</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-gray-900">{selectedFriendData.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Username</p>
            <p className="text-sm text-gray-900">@{selectedFriendData.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last seen</p>
            <p className="text-sm text-gray-900">
              {selectedFriendData.status === 'online' 
                ? 'Currently active' 
                : selectedFriendData.lastSeen 
                  ? new Date(selectedFriendData.lastSeen).toLocaleString() 
                  : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Shared files */}
      <div className="p-4 border-t">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shared Files</h3>
        <div className="space-y-2">
          <div className="flex items-center p-2 rounded hover:bg-gray-50 transition">
            <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">Project_document.pdf</p>
              <p className="text-xs text-gray-500">2.4 MB • Yesterday</p>
            </div>
          </div>
          <div className="flex items-center p-2 rounded hover:bg-gray-50 transition">
            <div className="h-10 w-10 bg-emerald-100 rounded flex items-center justify-center text-emerald-500">
              <BarChart className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">Data_analysis.xlsx</p>
              <p className="text-xs text-gray-500">4.8 MB • Last week</p>
            </div>
          </div>
        </div>
        <Button variant="link" className="mt-3 p-0 h-auto text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View all files
        </Button>
      </div>
      
      {/* Settings */}
      <div className="p-4 border-t">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Notifications</div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Show when I'm typing</div>
            <Switch 
              checked={showTypingEnabled} 
              onCheckedChange={setShowTypingEnabled}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Archive className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Archive chat</span>
            </div>
            <Button variant="ghost" size="icon" className="p-1 text-gray-500 hover:text-gray-700">
              <Archive className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ban className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Block user</span>
            </div>
            <Button variant="ghost" size="icon" className="p-1 text-gray-500 hover:text-gray-700">
              <Ban className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
