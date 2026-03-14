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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/research")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = `https://jp.mercari.com/search?keyword=${encodeURIComponent(searchQuery)}&shipping_from_area_id=1`;
    window.open(url, "_blank");
  };

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
      case "luxury": return <Sparkles className={className} />;
      case "gaming": return <Sparkles className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const activeCategory = data?.categories?.find(c => c.id === activeTab);

  return (
    <main className="max-w-md mx-auto min-h-screen p-0 pb-24 bg-white">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 glass-card border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Mercari Pro Logo" className="w-8 h-8 rounded-full" />
            <h1 className="text-2xl font-black gradient-text tracking-tighter">Mercari Pro</h1>
          </div>
          <button
            onClick={startResearch}
            disabled={isResearching}
            className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20 active:scale-95 transition-all"
            title="自動リサーチ実行"
          >
            {isResearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
        </div>

        {/* Custom Search Input */}
        <form onSubmit={(e) => e.preventDefault()} className="mb-6 relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="商品名を入力..."
            className="w-full pl-12 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-gold transition-colors" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button 
              onClick={() => {
                if (!searchQuery.trim()) return;
                window.open(`https://jp.mercari.com/search?keyword=${encodeURIComponent(searchQuery)}`, "_blank");
              }}
              className="p-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold active:scale-90 transition-all px-2"
              title="全国の相場を確認"
            >
              相場
            </button>
            <button 
              onClick={() => {
                if (!searchQuery.trim()) return;
                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery + " 北海道 仕入れ 買い付け 店舗")}`, "_blank");
              }}
              className="p-1.5 bg-gold text-white rounded-lg text-[10px] font-bold active:scale-90 transition-all px-2"
              title="北海道で仕入れ先を検索"
            >
              仕入
            </button>
          </div>
        </form>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {data?.categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all border ${
                activeTab === cat.id 
                  ? "bg-gold text-white border-gold shadow-sm" 
                  : "bg-gray-50 text-gray-500 border-gray-200"
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
            className="px-6 py-4 bg-gold/5 border-b border-gold/10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-2 text-xs text-gold font-bold">
              <span>市場動向を分析中...</span>
              <span>{researchProgress}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-400 text-[10px] uppercase tracking-widest font-black">
            {activeCategory?.title} アイテム一覧
          </h2>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
            {activeCategory?.items.length || 0} 件
          </span>
        </div>
        <div className="space-y-3">
          {activeCategory?.items.map((item, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="w-full glass-card p-4 rounded-2xl flex items-center justify-between text-left group active:scale-[0.98] transition-all bg-white hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-gold/40 flex-shrink-0" />
                <span className="font-semibold text-gray-700 group-hover:text-gold transition-colors truncate">
                  {item.name}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gold transition-colors flex-shrink-0" />
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
              className="w-full max-w-md bg-white rounded-t-[2.5rem] rounded-b-3xl overflow-hidden touch-pan-y shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />
              
              <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-black gradient-text tracking-tight">{selectedItem.name}</h3>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price Section */}
                  <div className="bg-gold/5 p-5 rounded-3xl border border-gold/10 flex flex-col items-center">
                    <span className="text-gold/60 text-[10px] font-black uppercase tracking-widest mb-1">推定取引価格（全国）</span>
                    <span className="text-3xl font-black text-gold">
                      {selectedItem.price || selectedItem.price_gap}
                    </span>
                  </div>

                  {/* Actions Section */}
                  <div className="grid grid-cols-1 gap-3">
                    <a 
                      href={selectedItem.mercari_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-slate-200"
                    >
                      <LinkIcon className="w-4 h-4" />
                      メルカリで全国の相場をチェック
                    </a>
                    
                    <button 
                      onClick={() => {
                        const query = `${selectedItem.name} 北海道 仕入れ 買い付け 店舗`;
                        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
                      }}
                      className="flex items-center justify-center gap-2 w-full py-4 premium-button rounded-2xl text-sm"
                    >
                      <Search className="w-4 h-4" />
                      北海道で仕入れ先を探す
                    </button>
                  </div>

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
