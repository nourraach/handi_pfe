export const MESSAGE_READ_STATE_KEY = "candidate_message_read_state_v1";
export const MESSAGE_READ_STATE_EVENT = "message-read-state-updated";

export type MessageReadState = Record<string, string>;

export type MessageConversationSummary = {
  id: string;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
};

export type MessageSummary = {
  id: string;
  id_utilisateur: string;
  created_at: string;
};

export function readMessageReadState(): MessageReadState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(MESSAGE_READ_STATE_KEY);
    return stored ? (JSON.parse(stored) as MessageReadState) : {};
  } catch {
    return {};
  }
}

export function writeMessageReadState(readState: MessageReadState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MESSAGE_READ_STATE_KEY, JSON.stringify(readState));
  window.dispatchEvent(new CustomEvent(MESSAGE_READ_STATE_EVENT));
}

export function isConversationUnread(conversation: MessageConversationSummary, readState: MessageReadState, currentUserId?: string) {
  if (!conversation.last_message_at) {
    return false;
  }

  if (currentUserId && conversation.last_message_sender_id === currentUserId) {
    return false;
  }

  const lastSeen = readState[conversation.id];
  return !lastSeen || new Date(lastSeen).getTime() < new Date(conversation.last_message_at).getTime();
}

export function countUnreadIncomingMessages(
  conversationId: string,
  messages: MessageSummary[],
  readState: MessageReadState,
  currentUserId?: string,
) {
  const lastSeen = readState[conversationId];
  const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

  return messages.filter((message) => {
    if (currentUserId && message.id_utilisateur === currentUserId) {
      return false;
    }

    return new Date(message.created_at).getTime() > lastSeenTime;
  }).length;
}
