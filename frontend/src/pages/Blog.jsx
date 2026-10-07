import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Tag, ArrowRight, Search } from "lucide-react";
import { STORAGE_URL } from "../config/api";
import api from "../services/api";

const CATEGORIES = [
  "Tous",
  "Protection solaire",
  "Soins visage",
  "Soins capillaires",
  "Bébé & Maman",
  "Compléments alimentaires",
  "Hygiène",
  "Paramédicaux",
  "Corps",
];

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .get("/blog")
      .then((res) => {
        setPosts(res.data.posts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchCategory =
      selectedCategory === "Tous" || post.category === selectedCategory;
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchCategory && matchSearch;
  });

  const featuredPost = posts.find((p) => p.is_featured);
  const showFeatured =
    featuredPost && selectedCategory === "Tous" && !searchQuery;
  const gridPosts = showFeatured
    ? posts.filter((p) => p.id !== featuredPost.id)
    : filteredPosts;

  if (loading)
    return (
      <div
        className="bg-[#fafaf8] min-h-screen flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
      </div>
    );

  return (
    <div
      className="bg-[#fafaf8] min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Hero ── */}
      <div
        className="border-b border-gray-100"
        style={{ background: "#f6f9f7" }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "48px 20px 40px",
          }}
          className="md:!py-16 md:!px-8"
        >
          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Notre blog
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Actualités & conseils beauté
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Conseils d'experts, routines soins, guides produits et actualités
              parapharmacie.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 1300, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-5 mb-12">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-gray-200 text-[13.5px] outline-none focus:border-[#1a5242] transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                  selectedCategory === cat
                    ? "text-white border-transparent"
                    : "text-gray-600 border-gray-200 hover:border-[#1a5242] hover:text-[#1a5242]"
                }`}
                style={
                  selectedCategory === cat
                    ? { background: "#1a5242" }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Article vedette ── */}
        {showFeatured && (
          <Link
            to={`/blog/${featuredPost.id}`}
            className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden mb-10 md:mb-14 group"
            style={{
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{ minHeight: 220 }}
            >
              {featuredPost.image && (
                <img
                  src={`${STORAGE_URL}/${featuredPost.image}`}
                  alt={featuredPost.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <span
                className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "#FFF3B0", color: "#355847" }}
              >
                À la une
              </span>
            </div>
            <div className="bg-white p-6 md:p-11 flex flex-col justify-center gap-4">
              <span
                className="inline-block w-fit text-[11.5px] font-semibold px-3 py-1 rounded-full"
                style={{ background: "#f0f7f4", color: "#1a5242" }}
              >
                {featuredPost.category}
              </span>
              <h2 className="text-[1.7rem] font-bold text-gray-900 leading-tight">
                {featuredPost.title}
              </h2>
              <p className="text-gray-500 text-[14.5px] leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex gap-5 text-gray-400 text-[12.5px]">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {featuredPost.read_time} de lecture
                </span>
                <span>
                  {new Date(featuredPost.created_at).toLocaleDateString(
                    "fr-FR",
                  )}
                </span>
              </div>
              <span
                className="inline-flex items-center gap-2 font-semibold text-[13.5px] mt-1"
                style={{ color: "#1a5242" }}
              >
                Lire l'article <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Grille ── */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
              >
                <Link
                  to={`/blog/${post.id}`}
                  className="relative block overflow-hidden group"
                  style={{ height: 200 }}
                >
                  {post.image && (
                    <img
                      src={`${STORAGE_URL}/${post.image}`}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                    />
                  )}
                  <span
                    className="absolute top-3.5 left-3.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "#1a5242" }}
                  >
                    {post.category}
                  </span>
                </Link>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between text-[12px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {post.read_time}
                    </span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <h3 className="text-[15.5px] font-bold text-gray-900 leading-snug">
                    <Link
                      to={`/blog/${post.id}`}
                      className="hover:text-[#1a5242] transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(post.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "#f0f7f4", color: "#355847" }}
                      >
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-[13px] mt-auto pt-1"
                    style={{ color: "#1a5242" }}
                  >
                    Lire l'article <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-[14px] mb-4">Aucun article trouvé.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Tous");
              }}
              className="px-6 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#1a5242" }}
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
