import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  status: text("status").default("offline").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  friendId: integer("friend_id")
    .notNull()
    .references(() => users.id),
  status: text("status").default("pending").notNull(), // pending, accepted, rejected one
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  status: text("status").default("sent").notNull(), // sent, delivered, read
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatar: true,
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  status: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type ClientToServerEvents = {
  message: (message: InsertMessage) => void;
  friendRequest: (request: InsertFriend) => void;
  updateStatus: (userId: number, status: string) => void;
  typing: (senderId: number, receiverId: number) => void;
  stopTyping: (senderId: number, receiverId: number) => void;
};

export type ServerToClientEvents = {
  message: (message: Message) => void;
  friendRequest: (request: Friend) => void;
  statusUpdate: (userId: number, status: string) => void;
  typing: (senderId: number) => void;
  stopTyping: (senderId: number) => void;
};
