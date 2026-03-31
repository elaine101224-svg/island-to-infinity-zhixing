"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Check, X, Plus, Pencil, Trash2, ArrowRight, X as XIcon } from "lucide-react";
import type { Family } from "@/types";

interface FamilyFormData {
  pseudonym: string;
  location: string;
  familyComposition: { adults: number; children: number; elderly: number };
  background: string;
  currentSituation: string;
  keyChallenges: string[];
  consentGiven: boolean;
}

const emptyForm: FamilyFormData = {
  pseudonym: "",
  location: "",
  familyComposition: { adults: 0, children: 0, elderly: 0 },
  background: "",
  currentSituation: "",
  keyChallenges: [],
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
        fetchFamilies();
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
        fetchFamilies();
      }
    } catch (error) {
      console.error("Error deleting family:", error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-500 text-sm mt-1">Manage family profiles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Family
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pseudonym
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Composition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {families.map((family) => (
              <tr key={family.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="font-medium text-gray-900">{family.pseudonym}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="h-4 w-4" />
                    {family.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C /{" "}
                  {family.familyComposition.elderly}E
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {family.consentGiven ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="h-4 w-4" />
                      {family.photos.length} photos
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <X className="h-4 w-4" />
                      No photos
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenModal(family)}
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(family.id)}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                    <a
                      href={`/families/${family.id}`}
                      className="text-rose-500 hover:text-rose-600 flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingFamily ? "Edit Family" : "Add Family"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pseudonym
                </label>
                <input
                  type="text"
                  value={formData.pseudonym}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pseudonym: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="e.g., Kaiyan Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="e.g., Changshu Urban Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adults
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.adults}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: {
                          ...prev.familyComposition,
                          adults: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.children}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: {
                          ...prev.familyComposition,
                          children: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elderly
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.familyComposition.elderly}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyComposition: {
                          ...prev.familyComposition,
                          elderly: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background
                </label>
                <textarea
                  value={formData.background}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, background: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Family background information..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Situation
                </label>
                <textarea
                  value={formData.currentSituation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentSituation: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Current family situation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Challenges
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChallenge())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    placeholder="Add a challenge..."
                  />
                  <button
                    type="button"
                    onClick={handleAddChallenge}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.keyChallenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span>{challenge}</span>
                      <button
                        onClick={() => handleRemoveChallenge(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consentGiven"
                  checked={formData.consentGiven}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, consentGiven: e.target.checked }))
                  }
                  className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="consentGiven" className="text-sm text-gray-700">
                  Photo consent given
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.pseudonym}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
