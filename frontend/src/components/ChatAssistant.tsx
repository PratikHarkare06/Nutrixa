import { useState, useRef, useEffect } from "react";
import { useUploadStore } from "../store/uploadStore";
import { sendChatMessageRequest, type ChatMessage } from "../services/chatApi";
import { CloseIcon, SpinnerIcon } from "./icons";

export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Hi there! I'm NutriBot, your AI Nutritionist. Ask me anything about your pantry, today's logged meals, or workouts!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const pantryAnalysis = useUploadStore((state) => state.pantryAnalysis);
  
  // Resolve current pantry list from Zustand store, falling back to typical mock items
  const pantryIngredients = pantryAnalysis 
    ? pantryAnalysis.identifiedIngredients 
    : ["Avocados", "Chicken Breast", "Quinoa", "Greek Yogurt", "Spinach"];

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isSending, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage: ChatMessage = { role: "user", text: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      // Exclude welcome message to avoid polluting API history unnecessarily
      const apiHistory = messages
        .slice(1)
        .map((msg) => ({ role: msg.role, text: msg.text }));

      const response = await sendChatMessageRequest(
        textToSend.trim(),
        apiHistory,
        pantryIngredients
      );

      if (response && response.success && response.text) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: response.text },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "I'm sorry, I encountered an error. Please try again." },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Failed to connect to NutriBot. Please check your connection." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const suggestionChips = [
    { label: "🍲 What to cook?", prompt: "What healthy recipes can I cook with ingredients in my pantry right now?" },
    { label: "🥑 Check protein limit", prompt: "Am I eating enough protein today based on my goals and logged meals?" },
    { label: "💪 Workout advice", prompt: "Give me some quick, practical tips for my active workout routine." },
  ];

  // Helper to format basic markdown-like content (bold and lists) in messages
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let content: React.ReactNode = line;
      
      // Handle simple bullet points
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      if (isBullet) {
        const rawLine = line.replace(/^[-*]\s+/, "");
        content = <span className="pl-3 block">• {parseBoldText(rawLine)}</span>;
      } else {
        content = parseBoldText(line);
      }

      return (
        <span key={idx} className="block min-h-[0.5rem]">
          {content}
        </span>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-textHeading">{part}</strong> : part);
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 right-8 z-40 w-14 h-14 bg-[#7A9E7E] hover:bg-[#5C7A60] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group"
          title="Chat with NutriBot"
        >
          {/* Chat Speech Icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 group-hover:rotate-12 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8815A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E8815A]"></span>
          </span>
        </button>
      )}

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 z-40 w-96 h-[520px] bg-white rounded-[24px] border border-border shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <header className="bg-[#7A9E7E] text-white flex items-center justify-between px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">
                🌿
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white">NutriBot</h3>
                <p className="text-[10px] text-white/80 font-medium">Your AI Health Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </header>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[78%] flex flex-col ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                {msg.role === "model" && index > 0 && (
                  <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider mb-1 ml-1">NutriBot</span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-[18px] text-xs font-semibold leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.03)] border ${
                    msg.role === "user"
                      ? "bg-[#9DB89F] border-[#8BAA8D] text-white rounded-tr-none"
                      : "bg-white border-border text-textBody rounded-tl-none"
                  }`}
                >
                  {formatMessageText(msg.text)}
                </div>
              </div>
            ))}

            {/* Quick Suggestion Chips */}
            {messages.length === 1 && !isSending && (
              <div className="pt-2 pl-1 space-y-2 animate-fade-in">
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Suggested Prompts:</p>
                <div className="flex flex-col gap-1.5 max-w-[90%]">
                  {suggestionChips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(chip.prompt)}
                      className="px-3.5 py-2 bg-white hover:bg-[#F5F6F1] border border-border hover:border-primary text-textBody hover:text-primary rounded-xl text-[11px] font-bold text-left transition-all shadow-sm leading-normal"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing Loader */}
            {isSending && (
              <div className="mr-auto items-start max-w-[78%] flex flex-col">
                <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider mb-1 ml-1">NutriBot</span>
                <div className="bg-white border border-border px-4 py-3 rounded-[18px] rounded-tl-none shadow-sm flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary skeleton-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary skeleton-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary skeleton-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-border flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask NutriBot a question..."
              disabled={isSending}
              className="flex-1 px-4 py-2 bg-[#F9FAF8] border border-border focus:border-[#7A9E7E] focus:ring-1 focus:ring-[#7A9E7E] rounded-xl text-xs outline-none font-medium transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="w-8 h-8 rounded-xl bg-[#9DB89F] hover:bg-[#7A9E7E] disabled:opacity-50 text-white flex items-center justify-center shadow-sm transition-colors shrink-0"
            >
              {isSending ? (
                <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
