"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Search } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";

interface Conversation {
  id: string;
  driverId: string;
  driverName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  body: string;
  sender: "dispatcher" | "driver";
  createdAt: string;
}

export default function TmsMessagesPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(() => {
    api<{ conversations: Conversation[] }>("/api/tms/messages")
      .then(({ conversations: rows }) => setConversations(rows))
      .catch(() => setConversations([]));
  }, []);

  useEffect(fetchConversations, [fetchConversations]);

  const fetchThread = useCallback((driverId: string) => {
    setMessages(null);
    api<{ messages: Message[] }>(`/api/tms/messages?driverId=${driverId}`)
      .then(({ messages: rows }) => setMessages(rows))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    if (selectedId) fetchThread(selectedId);
  }, [selectedId, fetchThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      await api("/api/tms/messages", {
        method: "POST",
        json: { driverId: selectedId, body: newMessage.trim() },
      });
      setNewMessage("");
      fetchThread(selectedId);
      fetchConversations();
    } catch (err) {
      toast("error", "Send failed", (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations?.filter((c) => {
    if (!search.trim()) return true;
    return (c.driverName ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const selectedConversation = conversations?.find((c) => c.driverId === selectedId);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Messages"
        subtitle="Communicate with drivers — dispatch updates, check-ins, and notes."
      />

      <div className="glass overflow-hidden rounded-2xl" style={{ height: "calc(100vh - 260px)", minHeight: 500 }}>
        <div className="flex h-full">
          {/* Left: conversation list */}
          <div className="flex w-80 shrink-0 flex-col border-r border-border">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
                <Input
                  placeholder="Search drivers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="!pl-8 !text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations === undefined || filteredConversations === null ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare size={20} className="text-ink-tertiary" />
                  <p className="mt-2 text-xs text-ink-tertiary">No conversations</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.driverId}
                    onClick={() => setSelectedId(conv.driverId)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent-soft/50 ${
                      selectedId === conv.driverId ? "bg-accent-soft/70" : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                      {(conv.driverName ?? "?").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold">
                          {conv.driverName || "Driver"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge tone="accent">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                        {conv.lastMessage}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-tertiary">
                        {formatRelative(conv.lastMessageAt)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: thread */}
          <div className="flex flex-1 flex-col">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={32} className="mx-auto text-ink-tertiary" />
                  <p className="mt-2 text-sm text-ink-tertiary">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="border-b border-border px-5 py-3">
                  <p className="text-sm font-semibold">
                    {selectedConversation?.driverName ?? "Driver"}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages === null ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 rounded-xl" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ink-tertiary">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === "dispatcher" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender === "dispatcher"
                              ? "bg-accent text-accent-text"
                              : "bg-surface-solid text-ink"
                          }`}
                        >
                          <p>{msg.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              msg.sender === "dispatcher" ? "text-accent-text/70" : "text-ink-tertiary"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose */}
                <form onSubmit={sendMessage} className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      loading={sending}
                      disabled={!newMessage.trim()}
                      icon={<Send size={14} />}
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
