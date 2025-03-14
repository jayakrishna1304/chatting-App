import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

type FriendWithStatus = {
  friend: User;
  status: string;
  id?: number; // Friendship ID for handling requests
};

type FriendsContextType = {
  friends: FriendWithStatus[];
  isLoading: boolean;
  error: Error | null;
  sendFriendRequest: (username: string) => void;
  acceptFriendRequest: (id: number) => void;
  rejectFriendRequest: (id: number) => void;
  removeFriend: (id: number) => void;
  cancelFriendRequest: (id: number) => void;
  isPendingAction: boolean;
};

const FriendsContext = createContext<FriendsContextType | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    data: friends = [],
    error,
    isLoading,
  } = useQuery<FriendWithStatus[], Error>({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/friends/request", { username });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/friends/request/${id}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: variables.status === "accepted" ? "Friend request accepted" : "Friend request rejected",
        description: variables.status === "accepted" 
          ? "You are now friends!" 
          : "The friend request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to respond to friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel a friend request that you sent
  const cancelFriendRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/friends/request/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request canceled",
        description: "Your friend request has been canceled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <FriendsContext.Provider
      value={{
        friends,
        isLoading,
        error,
        sendFriendRequest: (username) => sendFriendRequestMutation.mutate(username),
        acceptFriendRequest: (id) => respondToFriendRequestMutation.mutate({ id, status: "accepted" }),
        rejectFriendRequest: (id) => respondToFriendRequestMutation.mutate({ id, status: "rejected" }),
        removeFriend: (id) => removeFriendMutation.mutate(id),
        cancelFriendRequest: (id) => cancelFriendRequestMutation.mutate(id),
        isPendingAction: 
          sendFriendRequestMutation.isPending || 
          respondToFriendRequestMutation.isPending || 
          removeFriendMutation.isPending ||
          cancelFriendRequestMutation.isPending,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriends must be used within a FriendsProvider");
  }
  return context;
}
