import { apiClient as api } from "./apiClient";

export type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export type ChatResponse = {
  success: boolean;
  text: string;
};

export const sendChatMessageRequest = async (
  message: string,
  history: ChatMessage[],
  pantryIngredients: string[]
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>("/chat", {
    message,
    history,
    context: {
      pantryIngredients,
    },
  });
  return response.data;
};
