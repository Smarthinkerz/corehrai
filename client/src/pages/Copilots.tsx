import usePageTitle from "@/hooks/usePageTitle";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown, Users, Search, User, Target, GraduationCap, Shield,
  Send, Plus, Sparkles, Loader2, Trash2, MessageSquare, Bot, ChevronRight,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Crown, Users, Search, User, Target, GraduationCap, Shield,
};

interface Copilot {
  key: string; name: string; title: string; tagline: string;
  icon: string; accent: string; starters: string[];
}

interface Conversation {
  id: number; userId: number; copilotKey: string; title: string;
  messages: Array<{ role: "user" | "assistant"; content: string; ts: string }>;
  pinned: boolean; createdAt: string; updatedAt: string;
}

export default function Copilots() {
  usePageTitle("/copilots");
  const [activeKey, setActiveKey] = useState<string>("chro");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: copilots = [] } = useQuery<Copilot[]>({ queryKey: ["/api/copilots"] });
  const active = copilots.find(c => c.key === activeKey);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: [`/api/copilots/${activeKey}/conversations`],
    enabled: !!activeKey,
  });

  const { data: activeConv } = useQuery<Conversation>({
    queryKey: [`/api/copilots/conversations/${activeConvId}`],
    enabled: !!activeConvId,
  });

  const messages = activeConv?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeConvId]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId: number | null }) => {
      const res = await apiRequest("POST", `/api/copilots/${activeKey}/chat`, { message, conversationId: conversationId ?? undefined });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveConvId(data.conversation.id);
      queryClient.setQueryData([`/api/copilots/conversations/${data.conversation.id}`], data.conversation);
      queryClient.invalidateQueries({ queryKey: [`/api/copilots/${activeKey}/conversations`] });
      setInput("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/copilots/conversations/${id}`),
    onSuccess: (_, id) => {
      if (activeConvId === id) setActiveConvId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/copilots/${activeKey}/conversations`] });
    },
  });

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    chatMutation.mutate({ message: msg, conversationId: activeConvId });
  };

  const startNew = () => {
    setActiveConvId(null);
    setInput("");
  };

  const switchCopilot = (key: string) => {
    setActiveKey(key);
    setActiveConvId(null);
    setInput("");
  };

  // Optimistic last user message
  const pendingUserMessage = chatMutation.isPending ? chatMutation.variables?.message : null;

  const Icon = active ? (ICONS[active.icon] || Bot) : Bot;

  return (
    <div className="relative h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-1/3 w-[500px] h-[500px] bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      {/* Left rail: copilot picker */}
      <div className="w-[240px] shrink-0 border-r border-slate-200/60 bg-white/60 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Copilots</h2>
          </div>
          <p className="text-[11px] text-slate-500">7 role-aware AI assistants</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {copilots.length === 0 && (
              <div className="space-y-2 p-2">
                {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            )}
            {copilots.map((c) => {
              const CIcon = ICONS[c.icon] || Bot;
              const isActive = c.key === activeKey;
              return (
                <button
                  key={c.key}
                  onClick={() => switchCopilot(c.key)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 group ${
                    isActive
                      ? "bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-300/60 shadow-sm"
                      : "hover:bg-slate-100/70"
                  }`}
                  data-testid={`copilot-${c.key}`}
                >
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.accent} flex items-center justify-center shadow-md shrink-0 ${isActive ? "scale-105" : "group-hover:scale-105"} transition-transform`}>
                    <CIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{c.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Middle: conversations list */}
      <div className="w-[260px] shrink-0 border-r border-slate-200/60 bg-white/40 backdrop-blur-xl flex flex-col">
        <div className="p-3 border-b border-slate-200/60 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">History</h3>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={startNew} data-testid="button-new-chat">
            <Plus className="h-3 w-3" /> New
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {convsLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            {!convsLoading && conversations.length === 0 && (
              <div className="text-center py-8 px-3">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No conversations yet. Start one →</p>
              </div>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group p-2.5 rounded-lg cursor-pointer flex items-start gap-2 ${
                  c.id === activeConvId ? "bg-slate-100 ring-1 ring-slate-300/60" : "hover:bg-slate-100/60"
                }`}
                onClick={() => setActiveConvId(c.id)}
                data-testid={`conversation-${c.id}`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-400">{new Date(c.updatedAt).toLocaleDateString()}</div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 rounded transition-all"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id); }}
                  data-testid={`delete-${c.id}`}
                >
                  <Trash2 className="h-3 w-3 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {active && (
          <div className="border-b border-slate-200/60 bg-white/60 backdrop-blur-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${active.accent} flex items-center justify-center shadow-lg shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black text-slate-900 truncate" data-testid="text-active-copilot">{active.name}</h1>
                <p className="text-xs text-slate-500 truncate">{active.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live · GPT-5
              </Badge>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Empty state with starters */}
          {messages.length === 0 && !pendingUserMessage && active && (
            <div className="max-w-2xl mx-auto pt-8">
              <div className="text-center mb-8">
                <div className={`inline-flex h-20 w-20 rounded-2xl bg-gradient-to-br ${active.accent} items-center justify-center shadow-xl shadow-purple-500/20 mb-4`}>
                  <Icon className="h-9 w-9 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{active.name}</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{active.tagline}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {active.starters.map((s, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer border border-slate-200/60 bg-white/70 backdrop-blur-xl hover:border-slate-300 hover:shadow-md transition-all group"
                    onClick={() => send(s)}
                    data-testid={`starter-${i}`}
                  >
                    <CardContent className="p-3.5 flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{s}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} accent={active?.accent} icon={Icon} />
          ))}
          {pendingUserMessage && (
            <>
              <Message role="user" content={pendingUserMessage} accent={active?.accent} icon={Icon} />
              <Message role="assistant" content="" accent={active?.accent} icon={Icon} thinking />
            </>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200/60 bg-white/70 backdrop-blur-xl p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              placeholder={active ? `Ask ${active.name}…` : "Loading…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={chatMutation.isPending}
              className="bg-white/80"
              data-testid="input-message"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || chatMutation.isPending}
              className={`gap-2 bg-gradient-to-r ${active?.accent || "from-blue-600 to-purple-600"} text-white shadow-lg`}
              data-testid="button-send"
            >
              {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Each copilot uses live workforce data. Conversations are saved per copilot.
          </p>
        </div>
      </div>
    </div>
  );
}

function Message({
  role, content, accent, icon: Icon, thinking,
}: {
  role: "user" | "assistant"; content: string; accent?: string; icon: any; thinking?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 max-w-3xl mx-auto ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm ${
        isUser ? "bg-slate-700" : `bg-gradient-to-br ${accent || "from-blue-500 to-purple-500"}`
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Icon className="h-4 w-4 text-white" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        <div className={`inline-block max-w-full p-3.5 rounded-2xl ${
          isUser
            ? "bg-slate-800 text-white rounded-tr-sm"
            : "bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-tl-sm"
        }`}>
          {thinking ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
