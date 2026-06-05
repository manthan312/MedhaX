export const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socket.ids

export function isOnline(userId: string): boolean {
  return onlineUsers.has(userId) && (onlineUsers.get(userId)?.size ?? 0) > 0;
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}
