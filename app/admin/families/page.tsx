"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Check, X, Plus, Pencil, Trash2, ArrowRight, X as XIcon } from "lucide-react";
import type { Family } from "@/types";

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

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const res = await fetch("/api/admin/families");
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

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedData = await res.json();
        if (editingFamily) {
          setFamilies((prev) => prev.map((f) => (f.id === savedData.id ? savedData : f)));
        } else {
          setFamilies((prev) => [...prev, savedData]);
        }
        handleCloseModal();
      } else {
        console.error("Failed to save family");
      }
    } catch (error) {
      console.error("Error saving family:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this family?")) return;

    try {
      const res = await fetch(`/api/admin/families/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFamilies((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error("Error deleting family:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2.5xl font-bold text-slate-900 tracking-tight">Families</h1>
          <p className="text-slate-500 text-sm mt-1">Manage family profiles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-500 text-white px-4 py-2.5 rounded-xl hover:bg-rose-600 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm shadow-rose-200"
        >
          <Plus className="h-4 w-4" />
          Add Family
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Pseudonym</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Composition</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Photos</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {families.map((family) => (
              <tr key={family.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-rose-500" />
                    </div>
                    <span className="font-medium text-slate-900">{family.pseudonym}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {family.location}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </td>
                <td className="px-5 py-4">
                  {family.consentGiven ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Check className="h-3.5 w-3.5" />
                      {family.photos.length} photos
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                      <X className="h-3.5 w-3.5" />
                      No photos
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => handleOpenModal(family)}
                      className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
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
                      className="text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingFamily ? "Edit Family" : "Add Family"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pseudonym</label>
                <input
                  type="text"
                  value={formData.pseudonym}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pseudonym: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  placeholder="e.g., Kaiyan Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  placeholder="e.g., Changshu Urban Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Adults</label>
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Children</label>
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Elderly</label>
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Background</label>
                <textarea
                  value={formData.background}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, background: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  placeholder="Family background information..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Situation</label>
                <textarea
                  value={formData.currentSituation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentSituation: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  placeholder="Current family situation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Key Challenges</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChallenge())}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                    placeholder="Add a challenge..."
                  />
                  <button
                    type="button"
                    onClick={handleAddChallenge}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.keyChallenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl text-sm"
                    >
                      <span className="text-slate-700">{challenge}</span>
                      <button
                        onClick={() => handleRemoveChallenge(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Highlights</label>
                <div className="space-y-2 mb-3">
                  {formData.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between px-4 py-3 bg-violet-50 rounded-xl text-sm"
                    >
                      <div>
                        <span className="font-medium text-violet-700">{highlight.title}</span>
                        <span className="text-violet-500 ml-2 text-xs">({highlight.date})</span>
                        <p className="text-violet-600 mt-1">{highlight.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveHighlight(index)}
                        className="text-violet-400 hover:text-violet-600 ml-2 transition-colors"
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
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={newHighlight.title}
                    onChange={(e) => setNewHighlight((prev) => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={newHighlight.description}
                    onChange={(e) => setNewHighlight((prev) => ({ ...prev, description: e.target.value }))}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                    placeholder="Description"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="w-full px-4 py-2.5 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 font-medium text-sm transition-colors"
                >
                  Add Highlight
                </button>
              </div>

              {/* Photos Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Photos</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative bg-slate-50 rounded-xl p-2">
                      <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover rounded-lg" />
                      <p className="text-xs text-slate-600 mt-1.5 truncate px-1">{photo.caption}</p>
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow hover:bg-slate-100 transition-colors"
                      >
                        <XIcon className="h-3 w-3 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm text-slate-600"
                  />
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                    placeholder="Caption"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={!photoUrl}
                  className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
                  className="w-4 h-4 text-rose-500 border-slate-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="consentGiven" className="text-sm text-slate-700">
                  Photo consent given
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t bg-slate-50 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-sm shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.pseudonym}
                className="px-5 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 font-medium text-sm shadow-sm shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
