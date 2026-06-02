"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Pencil, Trash2, X as XIcon, Check } from "lucide-react";
import type { SupportPlan, Family, FocusArea, PlanStatus } from "@/types";

const focusAreaLabels: Record<FocusArea, string> = {
  social: "Social",
  financial: "Financial",
  academic: "Academic",
};

const focusAreaColors: Record<FocusArea, string> = {
  social: "bg-sage/10 text-sage border-sage/20",
  financial: "bg-terracotta/10 text-terracotta border-terracotta/20",
  academic: "bg-amber-warm/10 text-amber-warm border-amber-warm/20",
};

const statusLabels: Record<PlanStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
};

const statusColors: Record<PlanStatus, string> = {
  active: "bg-sage/10 text-sage",
  completed: "bg-sand text-earth-mid",
  on_hold: "bg-amber-light/40 text-amber-warm",
};

interface PlanFormData {
  familyIds: string[];
  title: string;
  focusArea: FocusArea;
  status: PlanStatus;
  startDate: string;
  targetEndDate: string;
  ethicsDescription: string;
}

const emptyForm: PlanFormData = {
  familyIds: [],
  title: "",
  focusArea: "social",
  status: "active",
  startDate: new Date().toISOString().split("T")[0],
  targetEndDate: "",
  ethicsDescription: "",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SupportPlan[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SupportPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, familiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/plans`),
        fetch(`${API_BASE}/api/admin/families`),
      ]);
      if (plansRes.ok) setPlans(await plansRes.json());
      if (familiesRes.ok) setFamilies(await familiesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const familyMap = new Map(families.map((f) => [f.id, f.pseudonym]));

  const handleOpenModal = (plan?: SupportPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        familyIds: plan.familyIds || [],
        title: plan.title,
        focusArea: plan.focusArea,
        status: plan.status,
        startDate: plan.startDate,
        targetEndDate: plan.targetEndDate || "",
        ethicsDescription: plan.ethicsDescription,
      });
    } else {
      setEditingPlan(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData(emptyForm);
  };

  const handleToggleFamily = (familyId: string) => {
    setFormData((prev) => ({
      ...prev,
      familyIds: prev.familyIds.includes(familyId)
        ? prev.familyIds.filter((id) => id !== familyId)
        : [...prev.familyIds, familyId],
    }));
  };

  const handleSave = async () => {
    if (formData.familyIds.length === 0 || !formData.title) return;
    setIsSaving(true);
    try {
      const url = editingPlan
        ? `${API_BASE}/api/admin/plans/${editingPlan.id}`
        : `${API_BASE}/api/admin/plans`;
      const method = editingPlan ? "PUT" : "POST";

      const body = editingPlan
        ? { ...formData }
        : { ...formData, objectives: [], activities: [] };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedData = await res.json();
        if (editingPlan) {
          setPlans((prev) => prev.map((p) => (p.id === savedData.id ? savedData : p)));
        } else {
          setPlans((prev) => [...prev, savedData]);
        }
        handleCloseModal();
      } else {
        console.error("Failed to save plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const getFamilyNames = (familyIds: string[]) => {
    if (!familyIds || familyIds.length === 0) return "None";
    return familyIds.map((id) => familyMap.get(id) || "Unknown").join(", ");
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
          <h1 className="text-2.5xl font-serif font-bold text-earth-dark tracking-tight">Support Plans</h1>
          <p className="text-earth-mid text-sm mt-1">Manage family support plans</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-cream border-b border-sand">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Families</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Focus Area</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Progress</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/60">
            {plans.map((plan) => {
              const achievedObjectives = plan.objectives?.filter((o) => o.status === "achieved").length || 0;
              const totalObjectives = plan.objectives?.length || 0;

              return (
                <tr key={plan.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-terracotta/10 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-terracotta" />
                      </div>
                      <span className="font-medium text-earth-dark">{plan.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-earth-mid">
                    {getFamilyNames(plan.familyIds)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${focusAreaColors[plan.focusArea]}`}>
                      {focusAreaLabels[plan.focusArea]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-sand rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-terracotta to-terracotta-dark rounded-full"
                          style={{
                            width: totalObjectives > 0 ? `${(achievedObjectives / totalObjectives) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-earth-mid font-medium">
                        {achievedObjectives}/{totalObjectives}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="text-sage hover:text-sage/80 font-medium flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sand sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-earth-dark">
                {editingPlan ? "Edit Plan" : "Create Plan"}
              </h2>
              <button onClick={handleCloseModal} className="text-earth-light hover:text-earth-dark p-1.5 rounded-lg hover:bg-sand/50 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Families</label>
                <p className="text-xs text-earth-light mb-2">Select one or more families</p>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-sand rounded-xl p-3">
                  {families.map((f) => {
                    const isSelected = formData.familyIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleFamily(f.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                          isSelected
                            ? "bg-terracotta/10 border border-terracotta/30 text-earth-dark"
                            : "bg-white border border-sand text-earth-mid hover:border-terracotta/30"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-terracotta border-terracotta" : "border-earth-light"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium">{f.pseudonym}</span>
                        <span className="text-xs text-earth-light ml-auto">{f.location}</span>
                      </button>
                    );
                  })}
                </div>
                {formData.familyIds.length > 0 && (
                  <p className="text-xs text-terracotta mt-1">{formData.familyIds.length} family selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Focus Area</label>
                <select
                  value={formData.focusArea}
                  onChange={(e) => setFormData({ ...formData, focusArea: e.target.value as FocusArea })}
                  className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                >
                  {Object.entries(focusAreaLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
                  className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Target End Date</label>
                  <input
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                    className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Ethics Description</label>
                <textarea
                  value={formData.ethicsDescription}
                  onChange={(e) => setFormData({ ...formData, ethicsDescription: e.target.value })}
                  rows={3}
                  className="w-full border border-sand rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-earth-dark"
                />
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
                disabled={isSaving || formData.familyIds.length === 0 || !formData.title}
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