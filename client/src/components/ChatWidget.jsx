/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { aiService } from "@/services/api";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

const buildWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname;
  const port = import.meta.env.VITE_WS_PORT || "5000";
  return `${protocol}://${host}:${port}/ws/chat`;
};

const ChatWidget = ({ user, enableAi = true, onUnreadChange }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("live");
  const [liveMessages, setLiveMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unreadLiveCount, setUnreadLiveCount] = useState(0);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  const currentMessages = useMemo(
    () => (mode === "live" ? liveMessages : aiMessages),
    [mode, liveMessages, aiMessages],
  );

  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          user: {
            id: user._id || user.id || null,
            name: user.name || "Unknown",
            role: user.role || "guest",
          },
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (["chat", "system", "presence", "error"].includes(payload.type)) {
          setLiveMessages((prev) => [...prev.slice(-79), payload]);
          const fromOtherUser =
            payload.type === "chat" &&
            payload.user?.id &&
            String(payload.user.id) !== String(user?._id || user?.id);
          if (fromOtherUser && (!open || mode !== "live")) {
            setUnreadLiveCount((prev) => prev + 1);
          }
        }
      } catch (_error) {
        // ignore malformed event payload
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  useEffect(() => {
    if (open && mode === "live" && unreadLiveCount > 0) {
      setUnreadLiveCount(0);
    }
  }, [open, mode, unreadLiveCount]);

  useEffect(() => {
    if (typeof onUnreadChange === "function") {
      onUnreadChange(unreadLiveCount);
    }
  }, [onUnreadChange, unreadLiveCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, open, mode]);

  const sendLiveMessage = () => {
    const text = input.trim();
    if (!text) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", text }));
      setInput("");
    }
  };

  const sendAiMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setAiMessages((prev) => [
      ...prev,
      {
        type: "chat",
        user: { name: user?.name || "You", role: user?.role || "user" },
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput("");
    setAiLoading(true);

    try {
      const response = await aiService.chatbot({ query: text });
      setAiMessages((prev) => [
        ...prev,
        {
          type: "chat",
          user: { name: "AI Assistant", role: "assistant" },
          text: response?.data?.answer || "No response",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (_error) {
      toast.error(getErrorMessage(_error, "Unable to process AI query"));
      setAiMessages((prev) => [
        ...prev,
        {
          type: "chat",
          user: { name: "AI Assistant", role: "assistant" },
          text: "Unable to answer right now.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = () => {
    if (mode === "live") {
      sendLiveMessage();
    } else {
      sendAiMessage();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[80]">
        <Button className="btn-primary shadow-lg relative" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Close Chat" : "Chat"}
          {unreadLiveCount > 0 && !open ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-white">
              {unreadLiveCount > 99 ? "99+" : unreadLiveCount}
            </span>
          ) : null}
        </Button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-6 z-[80] w-[92vw] max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{mode === "live" ? "Live Chat" : "AI Assistant"}</h3>
            <div className="flex gap-1">
              <Button
                className={`px-2 py-1 text-xs rounded ${mode === "live" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setMode("live")}
              >
                Live
              </Button>
              {enableAi && (
                <Button
                  className={`px-2 py-1 text-xs rounded ${mode === "ai" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}
                  onClick={() => setMode("ai")}
                >
                  AI
                </Button>
              )}
            </div>
          </div>

          <div ref={scrollRef} className="h-72 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50">
            {currentMessages.map((message, index) => (
              <div key={`${message.timestamp}-${index}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs text-gray-500 mb-1">
                  {message.user?.name || "System"} {message.timestamp ? `• ${new Date(message.timestamp).toLocaleTimeString()}` : ""}
                </p>
                <p className="text-sm text-gray-800">{message.text || message.message}</p>
              </div>
            ))}
            {!currentMessages.length && <p className="text-sm text-gray-500">No messages yet.</p>}
          </div>

          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <Input
              placeholder={mode === "live" ? "Type live message..." : "Ask AI..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
            <Button className="btn-primary" disabled={aiLoading} onClick={onSubmit}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
