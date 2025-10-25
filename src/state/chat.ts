import { create } from "zustand";
import { Message } from "../types/api";
import { INSIGHTS_LOGGED_CODE } from "../constants/config";
import { getMessages } from "../api/chat";

interface ChatState {
  messages: Message[];
  userName: string;
  userId: string;
  initialize: (name: string) => void;
  addMessage: (message: Message) => void;
  onScrollToTop: () => Promise<void>;
  clearMessages: () => void;
}

const keySet = new Set<string>();

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  userName: "",
  userId: "",
  initialize: (name) => {
    const id = `${INSIGHTS_LOGGED_CODE}${name.split(" ").join("_")}`;
    set({ userName: name, userId: id });
  },
  addMessage: (message: Message) => {
    set((state) => {
      // Prevent adding duplicate messages
      if (keySet.has(message.id.toString())) {
        return state;
      }
      keySet.add(message.id.toString());
      return { messages: [...state.messages, message] };
    });
  },

  onScrollToTop: async () => {
    const offset = get().messages.length;
    const limit = 20;
    const data = await getMessages(offset, limit);
    set((state) => ({
      messages: [...data.messages, ...state.messages],
    }));
  },

  clearMessages: () => set(() => ({ messages: [] })),
}));
