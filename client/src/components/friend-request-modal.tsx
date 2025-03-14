import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useFriends } from "@/hooks/use-friends";

type FriendRequestModalProps = {
  request: {
    id: number;
    sender: {
      id: number;
      username: string;
      avatar?: string;
    };
    message?: string;
  };
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
};

export default function FriendRequestModal({ 
  request, 
  onClose, 
  onAccept, 
  onDecline 
}: FriendRequestModalProps) {
  const { acceptFriendRequest, rejectFriendRequest, isPendingAction } = useFriends();
  
  const handleAccept = () => {
    acceptFriendRequest(request.id);
    onAccept();
  };
  
  const handleDecline = () => {
    rejectFriendRequest(request.id);
    onDecline();
  };
  
  return (
    <div className="fixed bottom-5 right-5 max-w-sm w-full bg-white rounded-lg shadow-lg border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">New Friend Request</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4 flex items-center">
        <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {request.sender.avatar ? (
            <img 
              src={request.sender.avatar} 
              alt={request.sender.username} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-gray-800">
              {request.sender.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="ml-4">
          <p className="font-medium text-gray-900">{request.sender.username}</p>
          <p className="text-sm text-gray-600">{request.message || 'Would like to connect with you'}</p>
        </div>
      </div>
      <div className="p-4 bg-gray-50 flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={handleDecline}
          disabled={isPendingAction}
        >
          Decline
        </Button>
        <Button 
          onClick={handleAccept}
          disabled={isPendingAction}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
