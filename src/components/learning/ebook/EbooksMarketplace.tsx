import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Filter, Star, BookOpen, Download, ShoppingCart, Check,
  Eye, Clock, Users, TrendingUp, Globe, Award, Bookmark, Share2,
  ChevronDown, X, Lock, Zap, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useToast } from "../../../context/ToastContext";

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  cover: string;
  language: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  skills: string[];
  rating: number;
  reviewCount: number;
  downloads: number;
  fileSize: number;
  pageCount: number;
  format: "pdf" | "epub";
  isNew: boolean;
  isBestseller: boolean;
  publishedDate: number;
  purchaseCount: number;
}

interface UserPurchase {
  ebookId: string;
  purchasedAt: number;
  readingProgress: number;
  lastAccessedAt: number;
  bookmarks: Array<{ pageNumber: number; note: string }>;
  highlights: Array<{ text: string; pageNumber: number; color: string }>;
}

interface FilterOptions {
  level: string[];
  language: string[];
  minRating: number;
  priceRange: [number, number];
  skills: string[];
}

export const EbooksMarketplace: React.FC<{
  setView?: (v: string) => void;
}> = ({ setView }) => {
  const { addToast } = useToast();
  const user = auth.currentUser;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"browse" | "purchases" | "wishlist">("browse");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "popular" | "price-low" | "price-high">("rating");

  const [filters, setFilters] = useState<FilterOptions>({
    level: [],
    language: [],
    minRating: 0,
    priceRange: [0, 10000],
    skills: []
  });

  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Ebook | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mock ebook data
  const ebooksData: Ebook[] = [
    {
      id: "ebook-1",
      title: "Kimbundu Essencial: Vocabulário da Vida Cotidiana",
      author: "Prof. João Kitondje",
      description: "Aprenda as 1000 palavras mais importantes do Kimbundu para conversar sobre tópicos do dia a dia.",
      price: 2990,
      cover: "https://images.unsplash.com/photo-1543002588-d4d8f8c4f8d4?w=300&h=400&fit=crop",
      language: "Kimbundu",
      level: "A1",
      skills: ["Vocabulário", "Pronúncia", "Conversação"],
      rating: 4.8,
      reviewCount: 247,
      downloads: 1250,
      fileSize: 12.5,
      pageCount: 180,
      format: "pdf",
      isNew: false,
      isBestseller: true,
      publishedDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
      purchaseCount: 450
    },
    {
      id: "ebook-2",
      title: "Gramática Kimbundu: Estruturas Essenciais",
      author: "Profa. Clarisse Ndungu",
      description: "Um guia completo de gramática Kimbundu com exercícios práticos e explicações claras.",
      price: 3990,
      cover: "https://images.unsplash.com/photo-1507842217343-583f7270bfed?w=300&h=400&fit=crop",
      language: "Kimbundu",
      level: "A2",
      skills: ["Gramática", "Escrita", "Leitura"],
      rating: 4.6,
      reviewCount: 189,
      downloads: 890,
      fileSize: 15.8,
      pageCount: 220,
      format: "pdf",
      isNew: false,
      isBestseller: true,
      publishedDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
      purchaseCount: 380
    },
    {
      id: "ebook-3",
      title: "Histórias Tradicionais Kimbundu (B1)",
      author: "Elder Nzambi",
      description: "Coleção de histórias folclóricas e tradicionais em Kimbundu para melhorar compreensão auditiva.",
      price: 2490,
      cover: "https://images.unsplash.com/photo-1507842217343-583f7270bfed?w=300&h=400&fit=crop",
      language: "Kimbundu",
      level: "B1",
      skills: ["Compreensão Auditiva", "Vocabulário Avançado", "Cultura"],
      rating: 4.9,
      reviewCount: 312,
      downloads: 1680,
      fileSize: 28.3,
      pageCount: 280,
      format: "epub",
      isNew: true,
      isBestseller: true,
      publishedDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      purchaseCount: 520
    },
    {
      id: "ebook-4",
      title: "Português Europeu vs Kimbundu: Comparação Linguística",
      author: "Dr. Miguel Kasanda",
      description: "Análise comparativa entre Português e Kimbundu para falantes avançados.",
      price: 4990,
      cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
      language: "Kimbundu",
      level: "C1",
      skills: ["Análise Linguística", "Vocabulário Acadêmico", "Tradução"],
      rating: 4.4,
      reviewCount: 98,
      downloads: 420,
      fileSize: 18.5,
      pageCount: 200,
      format: "pdf",
      isNew: false,
      isBestseller: false,
      publishedDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
      purchaseCount: 150
    },
    {
      id: "ebook-5",
      title: "Business Kimbundu: Negócios e Empreendedorismo",
      author: "Eng. Adilson Mbone",
      description: "Vocabulário e frases essenciais para negócios e ambiente corporativo em Kimbundu.",
      price: 3490,
      cover: "https://images.unsplash.com/photo-1507842217343-583f7270bfed?w=300&h=400&fit=crop",
      language: "Kimbundu",
      level: "B2",
      skills: ["Vocabulário de Negócios", "Comunicação Profissional", "Emails"],
      rating: 4.7,
      reviewCount: 156,
      downloads: 680,
      fileSize: 16.2,
      pageCount: 240,
      format: "pdf",
      isNew: false,
      isBestseller: false,
      publishedDate: Date.now() - 150 * 24 * 60 * 60 * 1000,
      purchaseCount: 280
    }
  ];

  // Fetch user purchases
  useEffect(() => {
    if (!user) return;

    const purchasesQuery = query(
      collection(db, "user_ebook_purchases"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(purchasesQuery, (snapshot) => {
      const purchases: UserPurchase[] = [];
      snapshot.forEach((doc) => {
        purchases.push(doc.data() as UserPurchase);
      });
      setUserPurchases(purchases);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter and sort ebooks
  const filteredEbooks = useMemo(() => {
    let result = ebooksData.filter(book => {
      // Search filter
      if (searchQuery && !book.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !book.author.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Level filter
      if (filters.level.length > 0 && !filters.level.includes(book.level)) {
        return false;
      }

      // Language filter
      if (filters.language.length > 0 && !filters.language.includes(book.language)) {
        return false;
      }

      // Rating filter
      if (book.rating < filters.minRating) {
        return false;
      }

      // Price range filter
      if (book.price < filters.priceRange[0] || book.price > filters.priceRange[1]) {
        return false;
      }

      // Skills filter
      if (filters.skills.length > 0) {
        const hasSkill = filters.skills.some(skill => book.skills.includes(skill));
        if (!hasSkill) return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => b.publishedDate - a.publishedDate);
        break;
      case "popular":
        result.sort((a, b) => b.purchaseCount - a.purchaseCount);
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [searchQuery, filters, sortBy]);

  const handlePurchaseBook = (book: Ebook) => {
    const isPurchased = userPurchases.some(p => p.ebookId === book.id);

    if (isPurchased) {
      addToast(`Você já possui "${book.title}". Acesse na aba Minhas Compras.`, "info");
      return;
    }

    addToast(`Processando compra de "${book.title}"...`, "info");
    setTimeout(() => {
      addToast(`Livro adquirido com sucesso! Comece a ler agora.`, "success");
      // In production: call payment API to create Stripe charge
    }, 1500);
  };

  const toggleWishlist = (bookId: string) => {
    if (wishlist.includes(bookId)) {
      setWishlist(wishlist.filter(id => id !== bookId));
      addToast("Removido da lista de desejos", "success");
    } else {
      setWishlist([...wishlist, bookId]);
      addToast("Adicionado à lista de desejos", "success");
    }
  };

  const purchasedBookIds = userPurchases.map(p => p.ebookId);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">
          Marketplace de E-books
        </h1>
        <p className="text-slate-600 text-sm md:text-base mt-2">
          Acesse uma biblioteca curada de livros para aprender Kimbundu e outras línguas
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {(["browse", "purchases", "wishlist"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
              selectedTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "browse" && "Explorar Livros"}
            {tab === "purchases" && `Minhas Compras (${purchasedBookIds.length})`}
            {tab === "wishlist" && `Lista de Desejos (${wishlist.length})`}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {selectedTab === "browse" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Procure por título, autor ou assunto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="rating">Melhor Avaliação</option>
              <option value="newest">Mais Recentes</option>
              <option value="popular">Mais Popular</option>
              <option value="price-low">Menor Preço</option>
              <option value="price-high">Maior Preço</option>
            </select>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6"
              >
                {/* Level Filter */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Nível CEFR</h4>
                  <div className="flex flex-wrap gap-2">
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          if (filters.level.includes(level)) {
                            setFilters({ ...filters, level: filters.level.filter(l => l !== level) });
                          } else {
                            setFilters({ ...filters, level: [...filters.level, level] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          filters.level.includes(level)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Classificação Mínima</h4>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilters({ ...filters, minRating: rating })}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          filters.minRating === rating
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {rating > 0 && <>
                          <Star className="w-3 h-3 fill-current" />
                          {rating}+
                        </>}
                        {rating === 0 && "Todos"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Faixa de Preço</h4>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-slate-900">até {filters.priceRange[1]} Kz</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="text-sm text-slate-600">
            Mostrando <strong>{filteredEbooks.length}</strong> livros
          </div>

          {/* Ebooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEbooks.map((book, idx) => {
              const isPurchased = purchasedBookIds.includes(book.id);
              const isInWishlist = wishlist.includes(book.id);

              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    {book.isNew && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">
                        Novo
                      </div>
                    )}
                    {book.isBestseller && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">
                        Bestseller
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{book.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(book.rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-600">
                        {book.rating} ({book.reviewCount})
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{book.level}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{book.pageCount}p</span>
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {!isPurchased ? (
                        <>
                          <div className="font-bold text-slate-900">
                            {(book.price / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "AOA"
                            })}
                          </div>
                          <button
                            onClick={() => handlePurchaseBook(book)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                          </button>
                        </>
                      ) : (
                        <div className="py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Adquirido
                        </div>
                      )}

                      <button
                        onClick={() => toggleWishlist(book.id)}
                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isInWishlist
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isInWishlist ? "fill-current" : ""}`} />
                        {isInWishlist ? "Adicionado" : "Wishlist"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {selectedTab === "purchases" && (
        <div className="space-y-6">
          {purchasedBookIds.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-lg">Nenhum livro adquirido</h3>
              <p className="text-slate-600 text-sm mt-2">Comece sua jornada de leitura explorando nosso catálogo</p>
              <button
                onClick={() => setSelectedTab("browse")}
                className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Explorar Livros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ebooksData.filter(b => purchasedBookIds.includes(b.id)).map((book, idx) => {
                const purchase = userPurchases.find(p => p.ebookId === book.id);
                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200"
                  >
                    <div className="flex gap-4">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-24 h-32 rounded-lg object-cover"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{book.title}</h3>
                          <p className="text-sm text-slate-500">{book.author}</p>
                        </div>

                        {purchase && (
                          <>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-600">Leitura: {purchase.readingProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-2 transition-all"
                                  style={{ width: `${purchase.readingProgress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Acessado: {new Date(purchase.lastAccessedAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> Ler
                          </button>
                          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {selectedTab === "wishlist" && (
        <div className="space-y-6">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-lg">Sua lista de desejos está vazia</h3>
              <p className="text-slate-600 text-sm mt-2">Salve seus livros favoritos para comparar e comprar depois</p>
              <button
                onClick={() => setSelectedTab("browse")}
                className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Explorar Livros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ebooksData.filter(b => wishlist.includes(b.id)).map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm">{book.title}</h3>
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900">
                        {(book.price / 100).toLocaleString("pt-BR", { style: "currency", currency: "AOA" })}
                      </strong>
                      <button
                        onClick={() => toggleWishlist(book.id)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handlePurchaseBook(book)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Comprar Agora
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
