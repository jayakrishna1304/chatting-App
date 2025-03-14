import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

type NotificationToastProps = {
  notification: {
    id: number;
    sender: {
      id: number;
      username: string;
      avatar?: string;
    };
    message: string;
  };
  onClose: () => void;
};

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const { selectFriend } = useChat();
  
  const handleClick = () => {
    selectFriend(notification.sender.id);
    onClose();
  };
  
  return (
    <div 
      className="fixed top-5 right-5 max-w-xs w-full bg-white rounded-lg shadow-lg border overflow-hidden cursor-pointer transition-all duration-300"
      onClick={handleClick}
    >
      <div className="p-3 flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {notification.sender.avatar ? (
            <img 
              src={notification.sender.avatar} 
              alt={notification.sender.username} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-gray-800">
              {notification.sender.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="font-medium text-gray-900 text-sm">{notification.sender.username}</p>
          <p className="text-xs text-gray-600 truncate">{notification.message}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-2 text-gray-500"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
