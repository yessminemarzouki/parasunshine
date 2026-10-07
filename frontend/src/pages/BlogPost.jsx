import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Tag,
  Share2,
  Facebook,
  ArrowRight,
  ShoppingBag,
  Link2,
  Check,
  ArrowUp,
} from "lucide-react";
import { STORAGE_URL } from "../config/api";
import api from "../services/api";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api
      .get("/blog")
      .then((res) => {
        const posts = res.data.posts || [];
        setAllPosts(posts);
        const found = posts.find((p) => p.id === parseInt(id));
        if (!found) {
          navigate("/blog");
          return;
        }
        setPost(found);
        const related = posts
          .filter(
            (p) => p.category_slug === found.category_slug && p.id !== found.id,
          )
          .slice(0, 3);
        if (related.length < 2) {
          const others = posts
            .filter(
              (p) => p.id !== found.id && !related.find((r) => r.id === p.id),
            )
            .slice(0, 3 - related.length);
          setRelatedPosts([...related, ...others]);
        } else {
          setRelatedPosts(related);
        }
      })
      .catch(() => navigate("/blog"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading || !post)
    return (
      <div
        className="bg-[#fafaf8] min-h-screen flex items-center justify-center"
        style={{ minHeight: "70vh" }}
      >
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
      </div>
    );

  const currentIndex = allPosts.findIndex((p) => p.id === parseInt(id));
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);

  const CATEGORIES = [
    { label: "Protection solaire", slug: "solaire" },
    { label: "Soins visage", slug: "soin" },
    { label: "Soins capillaires", slug: "capillaire" },
    { label: "Bébé & Maman", slug: "bebe-et-maman" },
    { label: "Compléments alimentaires", slug: "complements-alimentaires" },
  ];

  return (
    <div
      className="bg-[#fafaf8] min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Bouton retour en haut ── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
          style={{ background: "#1a5242" }}
          aria-label="Retour en haut"
        >
          <ArrowUp size={18} className="text-white" />
        </button>
      )}

      {/* ── Hero ── */}
      <div
        className="relative bg-cover bg-center h-[280px] md:h-[440px]"
        style={{
          backgroundImage: post.image
            ? `url(${STORAGE_URL}/${post.image})`
            : "none",
          backgroundColor: post.image ? undefined : "#1a5242",
        }}
      >
        <div
          className="absolute inset-0 flex items-end"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        >
          <div
            style={{ maxWidth: 1300, margin: "0 auto", width: "100%" }}
            className="px-5 md:px-8 pb-7 md:pb-10 flex flex-col gap-3.5"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-white/85 text-[13.5px] font-medium w-fit px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/15 transition-colors"
              style={{
                backdropFilter: "blur(4px)",
                background: "rgba(255,255,255,0.1)",
              }}
            >
              <ArrowLeft size={15} /> Retour au blog
            </Link>
            <span
              className="inline-block w-fit text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              {post.category}
            </span>
            <h1
              className="text-white text-[1.5rem] md:text-[2rem] font-bold leading-tight m-0"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-5 text-white/75 text-[13px]">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {post.read_time} de lecture
              </span>
              <span>
                {new Date(post.created_at).toLocaleDateString("fr-FR")}
              </span>
              <span>Par {post.author}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start px-5 py-10 md:px-8 md:py-16"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* ── Contenu principal ── */}
        <article
          className="bg-white rounded-2xl p-5 md:p-10"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(post.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: "#f0f7f4", color: "#355847" }}
              >
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>

          {/* Corps de l'article */}
          <div
            className="blog-content prose prose-neutral max-w-none text-[15px] leading-[1.85] text-gray-700
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-[1.4rem] prose-h2:mt-9 prose-h2:mb-3 prose-h2:pb-2.5 prose-h2:border-b prose-h2:border-gray-100
              prose-h3:text-[1.1rem] prose-h3:mt-6 prose-h3:mb-2
              prose-h3:text-[#1a5242]
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-a:text-[#1a5242] prose-a:underline
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:marker:text-[#355847]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <style>{`
            .blog-content strong,
            .blog-content em,
            .blog-content u {
              color: inherit !important;
            }
          `}</style>

          {/* Partage */}
          <div className="flex items-center gap-5 flex-wrap mt-11 pt-7 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-gray-600 text-[13.5px] font-semibold">
              <Share2 size={16} /> Partager cet article :
            </span>
            <div className="flex gap-2.5">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
              >
                <Facebook size={15} /> Facebook
              </a>
              <a
                href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                WhatsApp
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
              >
                {linkCopied ? (
                  <>
                    <Check size={15} style={{ color: "#1a5242" }} />
                    Copié !
                  </>
                ) : (
                  <>
                    <Link2 size={15} /> Copier le lien
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation précédent / suivant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-10 pt-7 border-t border-gray-100">
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.id}`}
                className="flex items-center gap-3 px-4 py-4 rounded-xl border border-gray-100 hover:border-[#1a5242]/30 hover:bg-[#f6f9f7] transition-all group"
              >
                <ArrowLeft
                  size={16}
                  className="text-gray-400 group-hover:text-[#1a5242] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                    Article précédent
                  </p>
                  <p className="text-[13.5px] font-semibold text-gray-800 group-hover:text-[#1a5242] truncate">
                    {prevPost.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextPost && (
              <Link
                to={`/blog/${nextPost.id}`}
                className="flex items-center justify-end gap-3 px-4 py-4 rounded-xl border border-gray-100 hover:border-[#1a5242]/30 hover:bg-[#f6f9f7] transition-all text-right group"
              >
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                    Article suivant
                  </p>
                  <p className="text-[13.5px] font-semibold text-gray-800 group-hover:text-[#1a5242] truncate">
                    {nextPost.title}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-400 group-hover:text-[#1a5242] flex-shrink-0"
                />
              </Link>
            )}
          </div>
        </article>

        {/* ── Sidebar ── */}
        <aside className="flex flex-col gap-6">
          {/* CTA produits */}
          <div
            className="rounded-2xl p-7 text-center"
            style={{ background: "#1a5242" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#FFF3B0" }}
            >
              <ShoppingBag size={22} style={{ color: "#355847" }} />
            </div>
            <h3 className="text-white text-[16px] font-bold mb-2">
              Produits recommandés
            </h3>
            <p className="text-white/75 text-[13px] leading-relaxed mb-5">
              Découvrez notre sélection {post.category.toLowerCase()}{" "}
              soigneusement choisie par nos experts.
            </p>
            <Link
              to={`/products?category=${post.category_slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-opacity hover:opacity-90"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Voir les produits <ArrowRight size={15} />
            </Link>
          </div>

          {/* Articles similaires */}
          {relatedPosts.length > 0 && (
            <div
              className="bg-white rounded-2xl p-6"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
            >
              <h3 className="text-[14px] font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Articles similaires
              </h3>
              <div className="flex flex-col gap-2">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.id}`}
                    className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {related.image && (
                        <img
                          src={`${STORAGE_URL}/${related.image}`}
                          alt={related.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: "#355847" }}
                      >
                        {related.category}
                      </p>
                      <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 mt-0.5">
                        {related.title}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                        <Clock size={11} /> {related.read_time}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Catégories */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            <h3 className="text-[14px] font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Catégories
            </h3>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-[#f6f9f7] hover:text-[#1a5242] transition-colors"
                >
                  {cat.label} <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPost;
