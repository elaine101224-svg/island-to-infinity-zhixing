"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Pencil, Trash2, X as XIcon } from "lucide-react";
import type { SupportPlan, Family, FocusArea, PlanStatus } from "@/types";

const focusAreaLabels: Record<FocusArea, string> = {
  mental_health: "Mental Health",
  companionship: "Companionship",
  social_integration: "Social Integration",
};

const focusAreaColors: Record<FocusArea, string> = {
  mental_health: "bg-purple-50 text-purple-700 border-purple-100",
  companionship: "bg-rose-50 text-rose-700 border-rose-100",
  social_integration: "bg-blue-50 text-blue-700 border-blue-100",
};

const statusLabels: Record<PlanStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
};

const statusColors: Record<PlanStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  on_hold: "bg-amber-50 text-amber-700",
};

interface PlanFormData {
  familyId: string;
  title: string;
  focusArea: FocusArea;
  status: PlanStatus;
  startDate: string;
  targetEndDate: string;
  ethicsDescription: string;
}

const emptyForm: PlanFormData = {
  familyId: "",
  title: "",
  focusArea: "companionship",
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
        familyId: plan.familyId,
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

  const handleSave = async () => {
    if (!formData.familyId || !formData.title) return;
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
          <h1 className="text-2.5xl font-bold text-slate-900 tracking-tight">Support Plans</h1>
          <p className="text-slate-500 text-sm mt-1">Manage family support plans</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-500 text-white px-4 py-2.5 rounded-xl hover:bg-rose-600 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm shadow-rose-200"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Family</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Focus Area</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Progress</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plans.map((plan) => {
              const achievedObjectives = plan.objectives?.filter((o) => o.status === "achieved").length || 0;
              const totalObjectives = plan.objectives?.length || 0;

              return (
                <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium text-slate-900">{plan.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {familyMap.get(plan.familyId) || "Unknown"}
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
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                          style={{
                            width: totalObjectives > 0 ? `${(achievedObjectives / totalObjectives) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        {achievedObjectives}/{totalObjectives}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPlan ? "Edit Plan" : "Create Plan"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Family</label>
                <select
                  value={formData.familyId}
                  onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                >
                  <option value="">Select a family</option>
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>{f.pseudonym}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Focus Area</label>
                <select
                  value={formData.focusArea}
                  onChange={(e) => setFormData({ ...formData, focusArea: e.target.value as FocusArea })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                >
                  {Object.entries(focusAreaLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Target End Date</label>
                  <input
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ethics Description</label>
                <textarea
                  value={formData.ethicsDescription}
                  onChange={(e) => setFormData({ ...formData, ethicsDescription: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
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
                disabled={isSaving || !formData.familyId || !formData.title}
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
