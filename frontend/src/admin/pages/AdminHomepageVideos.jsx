import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Upload,
  X,
  Trash2,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import {
  getHomepageVideoPositions,
  getHomepageVideos,
  saveHomepageVideo,
  toggleHomepageVideoActive,
  deleteHomepageVideo,
} from "../services/adminApi";
import { STORAGE_URL } from "../../config/api";
import {
  Btn,
  Input,
  Label,
  PageHeader,
  Spinner,
  Toast,
} from "../components/AdminShared";
const ConfirmModal = ({ title, onConfirm, onCancel, deleting }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <p className="text-[15px] font-bold text-gray-900 text-center mb-2">
        Confirmer la suppression
      </p>
      <p className="text-[13.5px] text-gray-500 text-center mb-6">
        Voulez-vous vraiment supprimer la vidéo de <strong>"{title}"</strong> ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Non, annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {deleting && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Oui, supprimer
        </button>
      </div>
    </div>
  </div>
);
export default function AdminHomepageVideos() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const [formSlot, setFormSlot] = useState(null); // { key, label, video? }
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // ← ajoute

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHomepageVideos();
      setSlots(data);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const openForm = (slot) => {
    setFormSlot(slot);
    setTitle(slot.video?.title || "");
    setVideoFile(null);
    setVideoPreview(
      slot.video?.video ? `${STORAGE_URL}/${slot.video.video}` : null,
    );
    setPosterFile(null);
    setPosterPreview(
      slot.video?.poster ? `${STORAGE_URL}/${slot.video.poster}` : null,
    );
    setError("");
  };

  const closeForm = () => setFormSlot(null);

  const handleVideoSelect = (file) => {
    if (!file || !file.type.startsWith("video/")) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handlePosterSelect = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!videoFile && !formSlot.video) {
      setError("Veuillez sélectionner un fichier vidéo.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("position", formSlot.key);
      if (title.trim()) fd.append("title", title.trim());
      if (videoFile) fd.append("video", videoFile);
      if (posterFile) fd.append("poster", posterFile);
      fd.append(
        "is_active",
        formSlot.video ? (formSlot.video.is_active ? "1" : "0") : "1",
      );

      await saveHomepageVideo(fd);
      showToast("Vidéo enregistrée avec succès.");
      closeForm();
      fetchSlots();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slot) => {
    setBusyKey(`toggle-${slot.key}`);
    try {
      await toggleHomepageVideoActive(slot.video.id);
      showToast(slot.video.is_active ? "Vidéo désactivée." : "Vidéo activée.");
      fetchSlots();
    } catch {
      showToast("Erreur.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const requestDelete = (slot) => setConfirmDelete(slot);

  const confirmDeleteVideo = async () => {
    if (!confirmDelete) return;
    setBusyKey(`delete-${confirmDelete.key}`);
    try {
      await deleteHomepageVideo(confirmDelete.video.id);
      setConfirmDelete(null);
      showToast("Vidéo supprimée.");
      fetchSlots();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBusyKey(null);
    }
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
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.label}
          onConfirm={confirmDeleteVideo}
          onCancel={() => setConfirmDelete(null)}
          deleting={busyKey === `delete-${confirmDelete.key}`}
        />
      )}
      <PageHeader
        title="Vidéos de la page d'accueil"
        subtitle="Une vidéo par emplacement — lecture automatique, muette, en boucle"
      />

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.key}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-24 h-16 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                {slot.video ? (
                  slot.video.poster ? (
                    <img
                      src={`${STORAGE_URL}/${slot.video.poster}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={`${STORAGE_URL}/${slot.video.video}`}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )
                ) : (
                  <Video size={18} className="text-gray-300" />
                )}
                {slot.video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={16} className="text-white" fill="white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900">
                  {slot.label}
                </p>
                {slot.video ? (
                  <p className="text-[12px] text-gray-400 truncate">
                    {slot.video.title || "Sans titre"}
                  </p>
                ) : (
                  <p className="text-[12px] text-gray-300 italic">
                    Aucune vidéo
                  </p>
                )}
              </div>

              {slot.video && (
                <button
                  onClick={() => handleToggle(slot)}
                  disabled={busyKey === `toggle-${slot.key}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors disabled:opacity-50 flex-shrink-0 ${
                    slot.video.is_active
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {slot.video.is_active ? "Actif" : "Désactivé"}
                </button>
              )}

              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openForm(slot)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a4731] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                >
                  {slot.video ? "Remplacer" : "Ajouter"}
                </button>
                {slot.video && (
                  <button
                    onClick={() => requestDelete(slot)}
                    disabled={busyKey === `delete-${slot.key}`}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {formSlot && (
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="text-[16px] font-bold text-gray-900">
                Vidéo — {formSlot.label}
              </p>
              <button
                onClick={closeForm}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label>Titre affiché au-dessus (optionnel)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Découvrez notre routine hydratation"
                  className="w-full"
                />
              </div>

              <div>
                <Label required={!formSlot.video}>
                  Fichier vidéo (MP4, WebM, MOV)
                </Label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleVideoSelect(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => document.getElementById("video-input").click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#1a4731] transition-all"
                >
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      className="w-full max-h-48 rounded-lg mx-auto"
                      controls
                      muted
                    />
                  ) : (
                    <div className="py-6">
                      <Upload
                        size={22}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-[12.5px] text-gray-400">
                        Glisser une vidéo ou cliquer pour sélectionner
                      </p>
                    </div>
                  )}
                  <input
                    id="video-input"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => handleVideoSelect(e.target.files?.[0])}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Taille max 100 Mo — privilégiez un format déjà compressé (MP4
                  H.264) pour un chargement rapide.
                </p>
              </div>

              <div>
                <Label>Image de couverture (optionnelle)</Label>
                <div
                  onClick={() =>
                    document.getElementById("poster-input").click()
                  }
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#1a4731] transition-all"
                >
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      alt=""
                      className="w-full max-h-32 object-cover rounded-lg mx-auto"
                    />
                  ) : (
                    <div className="py-4">
                      <ImageIcon
                        size={20}
                        className="mx-auto text-gray-300 mb-1"
                      />
                      <p className="text-[11.5px] text-gray-400">
                        Affichée avant le démarrage de la lecture
                      </p>
                    </div>
                  )}
                  <input
                    id="poster-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePosterSelect(e.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Btn ghost type="button" onClick={closeForm}>
                  Annuler
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
