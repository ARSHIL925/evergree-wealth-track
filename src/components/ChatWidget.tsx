import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Settings2, Sparkles } from "lucide-react";

type Lang = "en" | "hi" | "es" | "fr" | "ar" | "bn" | "ta" | "zh";

const LANG_META: Record<Lang, { label: string; native: string; dir?: "rtl" }> = {
  en: { label: "English", native: "English" },
  hi: { label: "Hindi", native: "हिन्दी" },
  es: { label: "Spanish", native: "Español" },
  fr: { label: "French", native: "Français" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
  bn: { label: "Bengali", native: "বাংলা" },
  ta: { label: "Tamil", native: "தமிழ்" },
  zh: { label: "Chinese", native: "中文" },
};

const GREETING: Record<Lang, string> = {
  en: "Hi! I'm the Evergreen helper. Tap any question below to see the answer.",
  hi: "नमस्ते! मैं Evergreen हेल्पर हूँ। नीचे किसी भी सवाल पर टैप करें।",
  es: "¡Hola! Soy el asistente de Evergreen. Toca una pregunta para ver la respuesta.",
  fr: "Bonjour ! Je suis l'assistant Evergreen. Touchez une question pour voir la réponse.",
  ar: "مرحبًا! أنا مساعد Evergreen. اضغط على أي سؤال أدناه لعرض الإجابة.",
  bn: "নমস্কার! আমি Evergreen সহায়ক। নিচের যেকোনো প্রশ্নে ট্যাপ করুন।",
  ta: "வணக்கம்! நான் Evergreen உதவியாளர். கீழேயுள்ள கேள்வியை தட்டவும்.",
  zh: "你好！我是 Evergreen 助手。点击下方任意问题查看答案。",
};

const SUGGESTED_LABEL: Record<Lang, string> = {
  en: "Suggested questions", hi: "सुझाए गए सवाल", es: "Preguntas sugeridas",
  fr: "Questions suggérées", ar: "أسئلة مقترحة", bn: "প্রস্তাবিত প্রশ্ন",
  ta: "பரிந்துரைக்கப்பட்ட கேள்விகள்", zh: "推荐问题",
};

// Full Q&A content is authored in English + Hindi. Other languages show a short
// note plus the English answer — good enough to be useful without shipping
// half-translated content.
const FAQ: Record<"en" | "hi", { q: string; a: string }[]> = {
  en: [
    { q: "What is a SIP?", a: "A Systematic Investment Plan (SIP) is a way to invest a fixed amount into a mutual fund every month. It builds discipline and uses rupee-cost averaging — you buy more units when prices fall, fewer when they rise — which smooths out market volatility over the long run." },
    { q: "How does compound interest work?", a: "Compounding earns interest on both your principal AND the interest already earned. The formula is A = P × (1 + r/n)^(n·t). The earlier you start, the more dramatic the growth — a ₹5,000 monthly SIP at 12% for 20 years grows to ~₹50 lakhs even though you only put in ₹12 lakhs." },
    { q: "How safe is my data on Evergreen?", a: "Every table uses Row-Level Security — your data is scoped to your user id and nobody else (not even other signed-in users) can read it. Traffic is HTTPS-only with strict security headers. See the Security page for the full list of controls." },
    { q: "Can I pay in dollars?", a: "Plan prices are billed in INR, but the Plans page shows a live FX-converted total in any currency you choose, so NRIs and travellers always know what they're paying in their home currency." },
    { q: "How do budgets work?", a: "Set a monthly or yearly cap per category. Evergreen projects where you'll land at the current pace and warns gently — no panic alerts. Add the same category twice and the caps add up." },
    { q: "Is my UPI ID stored?", a: "Only if you save it in your Profile, so we can pre-fill UPI QR codes for you. It is never shared with anyone else and you can clear it any time." },
    { q: "How do I edit an expense?", a: "On the Expenses page, tap the pencil icon next to any row to change the amount, currency, category or note. Tap the trash icon to delete." },
  ],
  hi: [
    { q: "SIP क्या है?", a: "SIP (सिस्टमैटिक इन्वेस्टमेंट प्लान) हर महीने एक तय रकम म्यूचुअल फंड में निवेश करने का तरीका है। यह अनुशासन बनाता है और रुपी-कॉस्ट एवरेजिंग के ज़रिए बाज़ार की उथल-पुथल को संतुलित करता है।" },
    { q: "चक्रवृद्धि ब्याज कैसे काम करता है?", a: "चक्रवृद्धि में मूलधन और पहले के ब्याज दोनों पर ब्याज मिलता है। सूत्र: A = P × (1 + r/n)^(n·t)। जितनी जल्दी शुरू करेंगे, उतना बड़ा फायदा।" },
    { q: "मेरा डेटा कितना सुरक्षित है?", a: "हर टेबल पर Row-Level Security लगी है — आपका डेटा सिर्फ़ आप ही देख सकते हैं। पूरी जानकारी Security पेज पर है।" },
    { q: "क्या मैं डॉलर में पे कर सकता/सकती हूँ?", a: "प्लान INR में बिल होते हैं, लेकिन Plans पेज लाइव रेट पर किसी भी करेंसी में टोटल दिखाता है ताकि NRI और यात्री अपनी होम करेंसी में रकम देख सकें।" },
    { q: "बजट कैसे काम करता है?", a: "हर कैटेगरी के लिए मासिक या सालाना सीमा सेट करें। वर्तमान रफ़्तार से Evergreen बताता है कि आप कहाँ पहुँचेंगे — बिना पैनिक के।" },
    { q: "क्या मेरी UPI ID स्टोर होती है?", a: "केवल तब जब आप Profile में सेव करें ताकि QR ऑटो-फिल हो सके। यह कभी किसी और के साथ साझा नहीं की जाती।" },
    { q: "खर्च कैसे एडिट करूँ?", a: "Expenses पेज पर किसी भी रो के बगल में पेंसिल आइकन दबाएँ — रकम, करेंसी, कैटेगरी या नोट बदल सकते हैं।" },
  ],
};

function faqFor(lang: Lang) {
  if (lang === "hi") return FAQ.hi;
  return FAQ.en;
}

type Msg = { from: "bot" | "user"; text: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("evergreen_lang") as Lang | null;
    if (saved && saved in LANG_META) setLang(saved);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evergreen_lang" && e.newValue && e.newValue in LANG_META) {
        setLang(e.newValue as Lang);
        setMessages([{ from: "bot", text: GREETING[e.newValue as Lang] }]);
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as Lang | undefined;
      if (detail && detail in LANG_META) {
        setLang(detail);
        setMessages([{ from: "bot", text: GREETING[detail] }]);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("evergreen:lang", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("evergreen:lang", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open || !lang) return;
    if (messages.length === 0) setMessages([{ from: "bot", text: GREETING[lang] }]);
  }, [open, lang, messages.length]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, lang]);

  const pickLang = (l: Lang) => {
    setLang(l);
    setShowPicker(false);
    setMessages([{ from: "bot", text: GREETING[l] }]);
    if (typeof window !== "undefined") {
      localStorage.setItem("evergreen_lang", l);
      window.dispatchEvent(new CustomEvent("evergreen:lang", { detail: l }));
    }
  };

  const ask = (q: string, a: string) => {
    setMessages((m) => [...m, { from: "user", text: q }, { from: "bot", text: a }]);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft ring-1 ring-primary/40 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Evergreen chat"
          className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold">Evergreen helper</div>
                <div className="text-[11px] text-muted-foreground">
                  {lang ? LANG_META[lang].native : "Choose a language"}
                </div>
              </div>
            </div>
            {lang && (
              <button
                onClick={() => setShowPicker((v) => !v)}
                aria-label="Chat settings"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}
          </header>

          {!lang || showPicker ? (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              <p className="font-display text-base">Choose your language</p>
              <p className="text-xs text-muted-foreground">You can change this later from the gear icon in this chat.</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LANG_META) as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => pickLang(code)}
                    className={`flex flex-col items-start rounded-2xl border px-3 py-2 text-left transition-all active:scale-95 ${
                      lang === code
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="text-sm font-medium">{LANG_META[code].native}</span>
                    <span className="text-[11px] text-muted-foreground">{LANG_META[code].label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div ref={scroller} dir={LANG_META[lang].dir} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                      m.from === "bot"
                        ? "bg-muted text-foreground"
                        : "ml-auto bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 bg-muted/30 p-2">
                <div className="mb-1 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {SUGGESTED_LABEL[lang]}
                </div>
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {faqFor(lang).map((f) => (
                    <button
                      key={f.q}
                      onClick={() => ask(f.q, f.a)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                    >
                      {f.q}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}