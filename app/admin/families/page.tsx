"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Check, X, Plus, Pencil, Trash2, ArrowRight, X as XIcon } from "lucide-react";
import type { Family } from "@/types";
import { useToast } from "@/components/admin/Toast";
import { adminFetch } from "@/lib/adminFetch";

interface PhotoFormData {
  url: string;
  caption: string;
  consentGiven: boolean;
}

interface HighlightFormData {
  date: string;
  title: string;
  description: string;
}

interface FamilyFormData {
  pseudonym: string;
  location: string;
  familyComposition: { adults: number; children: number; elderly: number };
  background: string;
  currentSituation: string;
  keyChallenges: string[];
  highlights: HighlightFormData[];
  photos: PhotoFormData[];
  consentGiven: boolean;
}

const emptyForm: FamilyFormData = {
  pseudonym: "",
  location: "",
  familyComposition: { adults: 0, children: 0, elderly: 0 },
  background: "",
  currentSituation: "",
  keyChallenges: [],
  highlights: [],
  photos: [],
  consentGiven: false,
};

export default function AdminFamiliesPage() {
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [formData, setFormData] = useState<FamilyFormData>(emptyForm);
  const [newChallenge, setNewChallenge] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newHighlight, setNewHighlight] = useState<HighlightFormData>({ date: "", title: "", description: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const res = await adminFetch("/api/admin/families");
      if (res.ok) {
        const data = await res.json();
        setFamilies(data);
      }
    } catch (error) {
      console.error("Error fetching families:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (family?: Family) => {
    if (family) {
      setEditingFamily(family);
      setFormData({
        pseudonym: family.pseudonym,
        location: family.location,
        familyComposition: { ...family.familyComposition },
        background: family.background,
        currentSituation: family.currentSituation,
        keyChallenges: [...family.keyChallenges],
        highlights: family.highlights.map(h => ({ ...h })),
        photos: family.photos.map(p => ({ ...p })),
        consentGiven: family.consentGiven,
      });
    } else {
      setEditingFamily(null);
      setFormData(emptyForm);
    }
    setNewChallenge("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFamily(null);
    setFormData(emptyForm);
    setNewChallenge("");
    setNewHighlight({ date: "", title: "", description: "" });
    setPhotoUrl("");
    setPhotoCaption("");
  };

  const handleAddChallenge = () => {
    if (newChallenge.trim()) {
      setFormData((prev) => ({
        ...prev,
        keyChallenges: [...prev.keyChallenges, newChallenge.trim()],
      }));
      setNewChallenge("");
    }
  };

  const handleRemoveChallenge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keyChallenges: prev.keyChallenges.filter((_, i) => i !== index),
    }));
  };

  const handleAddHighlight = () => {
    if (newHighlight.title.trim() && newHighlight.date) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, { ...newHighlight }],
      }));
      setNewHighlight({ date: "", title: "", description: "" });
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await adminFetch('/api/admin/uploads', {
        method: 'POST',
        body: formDataUpload,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Upload failed. Please try again.');
        return;
      }
      const data = (await res.json()) as { url: string };
      setPhotoUrl(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset the input so re-selecting the same file fires onChange again.
      e.target.value = '';
    }
  };

  const handleAddPhoto = () => {
    if (photoUrl) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, { url: photoUrl, caption: photoCaption, consentGiven: formData.consentGiven }],
      }));
      setPhotoUrl("");
      setPhotoCaption("");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingFamily
        ? `/api/admin/families/${editingFamily.id}`
        : "/api/admin/families";
      const method = editingFamily ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        json: formData,
      });

      if (res.ok) {
        const savedData = await res.json();
        if (editingFamily) {
          setFamilies((prev) => prev.map((f) => (f.id === savedData.id ? savedData : f)));
        } else {
          setFamilies((prev) => [...prev, savedData]);
        }
        toast.success(editingFamily ? "Family updated" : "Family added");
        handleCloseModal();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? `Couldn't save the family (${res.status}).`);
      }
    } catch (error) {
      console.error("Error saving family:", error);
      toast.error("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this family?")) return;

    try {
      const res = await adminFetch(`/api/admin/families/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFamilies((prev) => prev.filter((f) => f.id !== id));
        toast.success("Family deleted");
      } else {
        toast.error("Couldn't delete the family. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting family:", error);
      toast.error("Something went wrong while deleting. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2.5xl font-serif font-bold text-earth-dark tracking-tight">Families</h1>
          <p className="text-earth-mid text-sm mt-1">Manage family profiles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Family
        </button>
      </div>

      {families.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand shadow-sm py-16 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-terracotta" />
          </div>
          <h3 className="text-earth-dark font-semibold mb-1">No families yet</h3>
          <p className="text-earth-mid text-sm mb-5">Add your first family profile to get started.</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Family
          </button>
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-sand shadow-sm overflow-x-auto">
        <table className="min-w-[640px] w-full">
          <thead>
            <tr className="bg-cream border-b border-sand">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Pseudonym</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Location</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Composition</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Photos</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/60">
            {families.map((family) => (
              <tr key={family.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-terracotta/10 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-terracotta" />
                    </div>
                    <span className="font-medium text-earth-dark">{family.pseudonym}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-earth-mid text-sm">
                    <MapPin className="h-4 w-4 text-earth-light" />
                    {family.location}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-earth-mid">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </td>
                <td className="px-5 py-4">
                  {family.consentGiven ? (
                    <span className="inline-flex items-center gap-1 text-sage text-sm bg-sage/10 px-2.5 py-1 rounded-full">
                      <Check className="h-3.5 w-3.5" />
                      {family.photos.length} photos
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-earth-light text-sm">
                      <X className="h-3.5 w-3.5" />
                      No photos
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => handleOpenModal(family)}
                      className="text-sage hover:text-sage/80 font-medium flex items-center gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(family.id)}
                      className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                    <a
                      href={`/families/${family.id}`}
                      className="text-terracotta hover:text-terracotta-dark font-medium flex items-center gap-1"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sand sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-earth-dark">
                {editingFamily ? "Edit Family" : "Add Family"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-earth-light hover:text-earth-dark p-1.5 rounded-lg hover:bg-sand/50 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Pseudonym</label>
                <input
                  type="text"
                  value={formData.pseudonym}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pseudonym: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="e.g., Kaiyan Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="e.g., Changshu Urban Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Adults</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.adults}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: { ...prev.familyComposition, adults: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.children}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: { ...prev.familyComposition, children: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Elderly</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.elderly}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: { ...prev.familyComposition, elderly: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Background</label>
                <textarea
                  value={formData.background}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, background: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Family background information..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Current Situation</label>
                <textarea
                  value={formData.currentSituation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentSituation: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Current family situation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Key Challenges</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChallenge())}
                    className="flex-1 px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="Add a challenge..."
                  />
                  <button
                    type="button"
                    onClick={handleAddChallenge}
                    className="px-4 py-2.5 bg-sand/60 text-earth-mid rounded-xl hover:bg-sand font-medium text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.keyChallenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2.5 bg-cream/60 rounded-xl text-sm"
                    >
                      <span className="text-earth-mid">{challenge}</span>
                      <button
                        onClick={() => handleRemoveChallenge(index)}
                        className="text-earth-light hover:text-red-500 transition-colors"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights Section */}
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Highlights</label>
                <div className="space-y-2 mb-3">
                  {formData.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between px-4 py-3 bg-amber-light/30 rounded-xl text-sm"
                    >
                      <div>
                        <span className="font-medium text-earth-dark">{highlight.title}</span>
                        <span className="text-earth-mid ml-2 text-xs">({highlight.date})</span>
                        <p className="text-earth-mid mt-1">{highlight.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveHighlight(index)}
                        className="text-earth-light hover:text-earth-dark ml-2 transition-colors"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <input
                    type="date"
                    value={newHighlight.date}
                    onChange={(e) => setNewHighlight((prev) => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                  <input
                    type="text"
                    value={newHighlight.title}
                    onChange={(e) => setNewHighlight((prev) => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={newHighlight.description}
                    onChange={(e) => setNewHighlight((prev) => ({ ...prev, description: e.target.value }))}
                    className="px-3 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="Description"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="w-full px-4 py-2.5 bg-amber-warm/10 text-amber-warm rounded-xl hover:bg-amber-warm/20 font-medium text-sm transition-colors"
                >
                  Add Highlight
                </button>
              </div>

              {/* Photos Section */}
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Photos</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative bg-cream/60 rounded-xl p-2">
                      <img src={photo.url} alt={photo.caption} loading="lazy" decoding="async" className="w-full h-24 object-cover rounded-lg" />
                      <p className="text-xs text-earth-mid mt-1.5 truncate px-1">{photo.caption}</p>
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow hover:bg-sand/50 transition-colors"
                      >
                        <XIcon className="h-3 w-3 text-earth-mid" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    disabled={isUploadingPhoto}
                    className="flex-1 px-3 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-mid disabled:opacity-60"
                  />
                  {isUploadingPhoto && (
                    <span className="self-center text-xs text-earth-mid whitespace-nowrap">Uploading...</span>
                  )}
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="Caption"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={!photoUrl}
                  className="w-full px-4 py-2.5 bg-sand/60 text-earth-mid rounded-xl hover:bg-sand text-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Add Photo
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="consentGiven"
                  checked={formData.consentGiven}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, consentGiven: e.target.checked }))
                  }
                  className="w-4 h-4 text-terracotta border-sand rounded focus:ring-terracotta"
                />
                <label htmlFor="consentGiven" className="text-sm text-earth-mid">
                  Photo consent given
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-sand bg-cream/50 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-earth-mid bg-white border border-sand rounded-xl hover:bg-sand/50 font-medium text-sm shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.pseudonym}
                className="px-5 py-2.5 bg-terracotta text-white rounded-xl hover:bg-terracotta-dark font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
