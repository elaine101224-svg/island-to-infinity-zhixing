"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Pencil, Trash2, ArrowRight, X as XIcon } from "lucide-react";
import type { SupportPlan, Family, FocusArea, PlanStatus } from "@/types";

const focusAreaLabels: Record<FocusArea, string> = {
  mental_health: "Mental Health",
  companionship: "Companionship",
  social_integration: "Social Integration",
};

const focusAreaColors: Record<FocusArea, string> = {
  mental_health: "bg-purple-100 text-purple-700",
  companionship: "bg-rose-100 text-rose-700",
  social_integration: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<PlanStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
};

const statusColors: Record<PlanStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  on_hold: "bg-amber-100 text-amber-700",
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, familiesRes] = await Promise.all([
        fetch("/api/admin/plans"),
        fetch("/api/admin/families"),
      ]);
      if (plansRes.ok) {
        setPlans(await plansRes.json());
      }
      if (familiesRes.ok) {
        setFamilies(await familiesRes.json());
      }
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
    setIsSaving(true);
    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : "/api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";

      const body = editingPlan
        ? { ...formData }
        : {
            ...formData,
            objectives: [],
            activities: [],
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
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
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Manage family support plans</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Focus Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => {
              const achievedObjectives = plan.objectives.filter(
                (o) => o.status === "achieved"
              ).length;
              const totalObjectives = plan.objectives.length;

              return (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{plan.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {familyMap.get(plan.familyId) || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        focusAreaColors[plan.focusArea]
                      }`}
                    >
                      {focusAreaLabels[plan.focusArea]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[plan.status]
                      }`}
                    >
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{
                            width:
                              totalObjectives > 0
                                ? `${(achievedObjectives / totalObjectives) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {achievedObjectives}/{totalObjectives}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingPlan ? "Edit Plan" : "Add Plan"}
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
                  Family
                </label>
                <select
                  value={formData.familyId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, familyId: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                >
                  <option value="">Select a family</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.pseudonym}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="e.g., Elderly Companionship Support"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Focus Area
                  </label>
                  <select
                    value={formData.focusArea}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        focusArea: e.target.value as FocusArea,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  >
                    <option value="mental_health">Mental Health</option>
                    <option value="companionship">Companionship</option>
                    <option value="social_integration">Social Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as PlanStatus,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, targetEndDate: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ethics Description
                </label>
                <textarea
                  value={formData.ethicsDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ethicsDescription: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Describe the ethical considerations for this plan..."
                />
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
                disabled={isSaving || !formData.familyId || !formData.title}
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
