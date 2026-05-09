import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Paperclip, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { suggestedQuestions } from "@/mock-data";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  typing?: boolean;
}

const replies: Record<string, string> = {
  "How do I treat Apple Scab?":
    "**Apple Scab Treatment Plan**\n\n1. **Immediate**: Apply captan or myclobutanil fungicide every 10–14 days during wet periods.\n2. **Sanitation**: Rake and destroy fallen leaves to break the disease cycle.\n3. **Canopy management**: Prune for airflow and reduce leaf wetness.\n4. **Long term**: Switch to resistant cultivars like *Liberty* or *Enterprise*.\n\nMonitor weather — infection requires 6+ hours of leaf wetness at 12–24°C.",
  "Identify Spider Mite symptoms":
    "Spider mites cause a fine **stippling** pattern on the upper leaf surface, often progressing to bronzing. Look for **silken webbing** on the underside, especially near veins. Tap a leaf onto white paper — moving specks confirm an active infestation.",
  "Why are leaves turning yellow?":
    "Yellowing (chlorosis) typically signals one of:\n\n- **Nitrogen deficiency** — uniform pale color starting on older leaves\n- **Iron deficiency** — interveinal yellowing on new growth\n- **Overwatering** — yellowing with wilting and root rot\n- **Disease pressure** — mosaic patterns suggest viral infection\n\nShare a photo and I can pinpoint the cause.",
  "Best treatment for tomato blight?":
    "For **late blight** (Phytophthora infestans): apply chlorothalonil or mancozeb on dry foliage immediately, remove and bag infected material (do not compost), and switch to systemic cymoxanil if it persists. Stake plants and avoid overhead irrigation.",
  "Organic pest control methods":
    "Top organic strategies:\n\n- **Neem oil** — broad-spectrum, suppresses aphids, mites, whiteflies\n- **Beneficial insects** — ladybugs, lacewings, parasitic wasps\n- **Diatomaceous earth** — for soft-bodied crawling pests\n- **Companion planting** — basil with tomato, marigold borders\n- **Crop rotation** — breaks soil-borne pest cycles",
};

const fallback =
  "I can help with disease identification, treatment plans, soil and weather guidance, and integrated pest management. Try uploading an image in the Disease Detection tab for instant diagnosis.";

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatInterface() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Hello! I'm your AI Agronomist. I've trained on **2.4M field images** and the latest agricultural research. Ask me anything about crop health, treatments, or pests.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, time: now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    const typingId = crypto.randomUUID();
    setMessages((m) => [...m, { id: typingId, role: "assistant", content: "", time: now(), typing: true }]);
    setTimeout(() => {
      const reply = replies[text] || fallback;
      setMessages((m) =>
        m.map((msg) => (msg.id === typingId ? { ...msg, content: reply, typing: false } : msg)),
      );
      setBusy(false);
    }, 1100);
  };

  return (
    <div className="glass-strong rounded-3xl flex flex-col h-[calc(100vh-180px)] min-h-[560px] overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="size-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
          <Bot className="size-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            AI Agronomist
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium">ONLINE</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Trained on 2.4M field images · v2.4</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={"flex gap-3 " + (m.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={
                  "size-8 rounded-full grid place-items-center shrink-0 " +
                  (m.role === "user"
                    ? "bg-gradient-to-br from-earth to-earth/70 text-primary-foreground"
                    : "gradient-hero text-primary-foreground shadow-glow")
                }
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={"max-w-[80%] " + (m.role === "user" ? "items-end text-right" : "")}>
                <div
                  className={
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/60 rounded-tl-sm")
                  }
                >
                  {m.typing ? (
                    <span className="inline-flex gap-1">
                      <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
                    </span>
                  ) : (
                    formatMd(m.content)
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 px-1">{m.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length <= 1 && (
          <div className="pt-4">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3" /> Suggested questions
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs rounded-full px-3 py-1.5 glass hover:bg-accent/60 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="p-3 border-t border-border/50"
      >
        <div className="glass rounded-2xl pl-4 pr-2 py-2 flex items-center gap-2">
          <button type="button" className="text-muted-foreground hover:text-foreground"><Paperclip className="size-4" /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a disease, crop, or treatment…"
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />
          <button type="button" className="text-muted-foreground hover:text-foreground p-2"><Mic className="size-4" /></button>
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="size-9 rounded-xl gradient-hero text-primary-foreground grid place-items-center shadow-glow disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-muted-foreground"
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}

function formatMd(text: string) {
  // minimal: bold **x**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
