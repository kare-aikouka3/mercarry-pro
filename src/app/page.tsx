"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Sparkles, 
  Package, 
  Scissors, 
  Leaf, 
  RefreshCw, 
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  ExternalLink as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
  name: string;
  reason: string;
  background: string;
  source: string;
  price?: string;
  price_gap?: string;
  kind_word: string;
  mercari_url: string;
}

interface Category {
  id: string;
  title: string;
  items: Item[];
}

export default function Home() {
  const [data, setData] = useState<{ categories: Category[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<string>("natural");

  useEffect(() => {
    fetch("/api/research")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const startResearch = async () => {
    setIsResearching(true);
    setResearchProgress(0);
    setSelectedItem(null);
    
    for (let i = 0; i <= 100; i += 10) {
      setResearchProgress(i);
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 200));
    }

    const res = await fetch("/api/research", { method: "POST" });
    const json = await res.json();
    setData(json);
    setIsResearching(false);
  };

  const getIcon = (id: string, className = "w-5 h-5") => {
    switch (id) {
      case "natural": return <Leaf className={className} />;
      case "craft": return <Scissors className={className} />;
      case "discontinued": return <Package className={className} />;
      case "arbitrage": return <ArrowRightLeft className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const activeCategory = data?.categories.find(c => c.id === activeTab);

  return (
    <main className="max-w-md mx-auto min-h-screen p-0 pb-24 bg-slate-950">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 glass-card border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold gradient-text">Mercari Pro</h1>
          </div>
          <button
            onClick={startResearch}
            disabled={isResearching}
            className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20 active:scale-95 transition-all"
          >
            {isResearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {data?.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all border ${
                activeTab === cat.id 
                  ? "bg-gold text-slate-950 border-gold" 
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              {getIcon(cat.id, "w-3 h-3")}
              {cat.title.split(" (")[0]}
            </button>
          ))}
        </div>
      </header>

      {/* Progress Bar (Visible only during researching) */}
      <AnimatePresence>
        {isResearching && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="px-6 py-4 bg-gold/10 border-b border-gold/20 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-2 text-xs text-gold font-bold">
              <span>リサーチ中...</span>
              <span>{researchProgress}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gold"
                initial={{ width: 0 }}
                animate={{ width: `${researchProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List View */}
      <div className="px-6 py-6">
        <h2 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-4">
          {activeCategory?.title} 一覧
        </h2>
        <div className="space-y-3">
          {activeCategory?.items.map((item, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="w-full glass-card p-4 rounded-2xl flex items-center justify-between text-left group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold/50" />
                <span className="font-semibold text-slate-200 group-hover:text-gold transition-colors truncate max-w-[200px]">
                  {item.name}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-gold transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md glass-card rounded-t-[2.5rem] rounded-b-3xl overflow-hidden touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
              
              <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-bold gradient-text">{selectedItem.name}</h3>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-gold/10 p-4 rounded-2xl border border-gold/20">
                    <span className="text-gold text-xs font-bold uppercase tracking-wider">推定取引価格</span>
                    <span className="text-2xl font-black text-gold">
                      {selectedItem.price || selectedItem.price_gap}
                    </span>
                  </div>

                  <a 
                    href={selectedItem.mercari_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 premium-button rounded-2xl text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    メルカリで市場をチェック
                  </a>

                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <section className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-gold/80 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-bold">需要の理由</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{selectedItem.reason}</p>
                    </section>

                    <section className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-sky-400/80 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">背景（なぜ今）</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-sm">{selectedItem.background}</p>
                    </section>
                  </div>

                  <div className="bg-white/5 p-5 rounded-2xl border border-dashed border-gold/30">
                    <div className="text-[10px] uppercase tracking-widest text-gold/60 mb-2 font-black">親切な一言（コピペ推奨）</div>
                    <p className="text-slate-400 italic text-sm leading-relaxed">
                      "{selectedItem.kind_word}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence nav (Bottom) */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-card flex justify-around p-4 rounded-t-3xl border-t border-white/10 z-40">
        <button className="text-gold flex flex-col items-center">
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-bold">分析</span>
        </button>
        <button className="text-slate-500 flex flex-col items-center opacity-50">
          <Package className="w-6 h-6" />
          <span className="text-[10px] mt-1">在庫</span>
        </button>
        <button className="text-slate-500 flex flex-col items-center opacity-50">
          <RefreshCw className="w-6 h-6" />
          <span className="text-[10px] mt-1">設定</span>
        </button>
      </footer>
    </main>
  );
}
