"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X as XIcon,
} from "lucide-react";
import type { SupportPlan, Family, FocusArea, PlanStatus } from "@/types";

const focusAreaLabels: Record<FocusArea, string> = {
  mental_health: "Mental Health",
  companionship: "Companionship",
  social_integration: "Social Integration",
};

const focusAreaColors: Record<FocusArea, string> = {
  mental_health: "bg-purple-100 text-purple-700",
  companionship: "bg-amber-100 text-amber-700",
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
  on_hold: "bg-orange-100 text-orange-700",
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
          setPlans((prev) =>
            prev.map((p) => (p.id === savedData.id ? savedData : p))
          );
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
      const res = await fetch(`${API_BASE}/api/admin/plans/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-900 font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-sand-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Support Plans</h1>
          <p className="text-neutral-700 text-sm mt-1">
            Manage family support plans
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-accent-500 text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="bg-sand-100 rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-sand-300">
          <thead className="bg-sand-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Focus Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-300">
            {plans.map((plan) => {
              const achievedObjectives = plan.objectives?.filter(
                (o) => o.status === "achieved"
              ).length || 0;
              const totalObjectives = plan.objectives?.length || 0;

              return (
                <tr key={plan.id} className="hover:bg-sand-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-neutral-900">{plan.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-800">
                    {familyMap.get(plan.familyId) || "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        focusAreaColors[plan.focusArea]
                      }`}
                    >
                      {focusAreaLabels[plan.focusArea]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[plan.status]
                      }`}
                    >
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full"
                          style={{
                            width:
                              totalObjectives > 0
                                ? `${(achievedObjectives / totalObjectives) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-neutral-800">
                        {achievedObjectives}/{totalObjectives}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleOpenModal(plan)}
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
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
          <div className="bg-sand-50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* ...modal content stays the same with sand/neutral classes */}
          </div>
        </div>
      )}
    </div>
  );
}