import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Search,
  Phone,
  Sparkles,
  Mail,
  Gift,
  Package,
  X,
  CheckCircle2,
} from "lucide-react";
import { STORAGE_URL } from "../../config/api";
import {
  getStockRequests,
  sendStockAvailabilityEmail,
  markAsSeen,
} from "../services/adminApi";
import {
  Badge,
  ActionBtn,
  Input,
  Select,
  TableWrap,
  Table,
  TR,
  TD,
  Pagination,
  Spinner,
  PageHeader,
  Toast,
} from "../components/AdminShared";

export default function AdminStockRequests() {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [viewingItemName, setViewingItemName] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchRequests();
  }, [debouncedSearch, statusFilter, typeFilter, page]);

  useEffect(() => {
    markAsSeen("stock");
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getStockRequests({
        search: debouncedSearch,
        notified: statusFilter,
        type: typeFilter,
        page,
        per_page: 20,
      });
      setRequests(data.data || []);
      setMeta(data.meta || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const isNew = (dateStr) =>
    Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

  const handleSendEmail = async (id) => {
    setSendingEmailId(id);
    try {
      const result = await sendStockAvailabilityEmail(id);
      showToast(result.message, "success");
      // Mise à jour locale de la ligne — reste visible avec son nouveau
      // statut, même si le filtre courant est "À traiter uniquement".
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, notified: true, processed_at: new Date().toISOString() }
            : r,
        ),
      );
    } catch {
      showToast("Erreur lors de l'envoi de l'email.", "error");
    } finally {
      setSendingEmailId(null);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("fr-FR")} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleCall = (phone) => {
    window.location.href = "tel:" + phone;
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Demandes de stock"
        subtitle={`${meta.total ?? 0} demande(s) de notification`}
      />

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Client, téléphone ou produit..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Produits & Coffrets</option>
          <option value="product">Produits uniquement</option>
          <option value="bundle">Coffrets uniquement</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les demandes</option>
          <option value="false">À traiter</option>
          <option value="true">Traitées</option>
        </Select>
      </div>

      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "Produit",
              "Variante",
              "Qté",
              "Client",
              "Téléphone",
              "Date",
              "Statut",
              "Actions",
            ]}
            empty={requests.length === 0 ? "Aucune demande" : null}
          >
            {requests.map((r) => (
              <TR key={r.id} className={!r.notified ? "bg-amber-50/30" : ""}>
                <TD>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center ${
                        r.item_type === "bundle"
                          ? "border-[#1a5242]/30 bg-[#1a5242]/5"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      {r.item_image ? (
                        <img
                          src={`${STORAGE_URL}/${r.item_image}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : r.item_type === "bundle" ? (
                        <Gift size={15} className="text-[#1a5242]" />
                      ) : (
                        <Package size={15} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingItemName({
                              name: r.item_name,
                              type: r.item_type,
                            })
                          }
                          className="font-semibold text-[12.5px] max-w-[160px] truncate hover:text-[#1a4731] hover:underline transition-colors text-left"
                          title="Cliquer pour voir le nom complet"
                        >
                          {r.item_name}
                        </button>
                        {r.item_type === "bundle" ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-[#1a5242]/10 text-[#1a5242] border border-[#1a5242]/20 rounded-full flex-shrink-0">
                            <Gift size={8} /> Coffret
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-full flex-shrink-0">
                            <Package size={8} /> Produit
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Stock : {r.item_stock ?? "—"}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD>
                  {r.size || r.color || r.age ? (
                    <div className="flex flex-col gap-0.5">
                      {r.size && (
                        <span className="text-[11.5px] text-gray-700">
                          <span className="text-gray-400">Taille :</span>{" "}
                          <strong>{r.size}</strong>
                        </span>
                      )}
                      {r.age && (
                        <span className="text-[11.5px] text-gray-700">
                          <span className="text-gray-400">Âge :</span>{" "}
                          <strong>{r.age}</strong>
                        </span>
                      )}
                      {r.color && (
                        <span className="text-[11.5px] text-gray-700">
                          <span className="text-gray-400">Couleur :</span>{" "}
                          <strong>{r.color}</strong>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11.5px] text-gray-300">—</span>
                  )}
                </TD>
                <TD>
                  <span className="text-[12.5px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                    {r.quantity ?? 1}
                  </span>
                </TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-[13px]">
                      {r.first_name} {r.last_name}
                    </p>
                    {isNew(r.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        <Sparkles size={8} /> Nouveau
                      </span>
                    )}
                  </div>
                </TD>
                <TD>
                  <button
                    onClick={() => handleCall(r.phone)}
                    className="flex items-center gap-1.5 text-[13px] text-[#1a4731] font-semibold hover:underline"
                  >
                    <Phone size={12} />
                    {r.phone}
                  </button>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <Badge type={r.notified ? "success" : "warning"}>
                    {r.notified ? "Traité" : "À traiter"}
                  </Badge>
                  {Boolean(r.notified) && r.processed_at ? (
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      {formatDateTime(r.processed_at)}
                    </p>
                  ) : null}
                </TD>
                <TD>
                  {!r.notified ? (
                    <button
                      onClick={() => handleSendEmail(r.id)}
                      disabled={sendingEmailId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a4731] text-white text-[11.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                    >
                      {sendingEmailId === r.id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Mail size={13} />
                      )}
                      Envoyer email de disponibilité
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-600">
                      <CheckCircle2 size={14} /> Email envoyé
                    </span>
                  )}
                </TD>
              </TR>
            ))}
          </Table>
        )}
        <Pagination meta={meta} page={page} setPage={setPage} />
      </TableWrap>

      {viewingItemName && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setViewingItemName(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  viewingItemName.type === "bundle"
                    ? "bg-[#1a5242]/10 text-[#1a5242] border border-[#1a5242]/20"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {viewingItemName.type === "bundle" ? (
                  <>
                    <Gift size={11} /> Coffret
                  </>
                ) : (
                  <>
                    <Package size={11} /> Produit
                  </>
                )}
              </span>
              <button
                onClick={() => setViewingItemName(null)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[15px] font-bold text-gray-900 leading-snug">
              {viewingItemName.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
