"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, X as XIcon, Mail, Phone, Check } from "lucide-react";
import type { TeamMember, MemberRole, MemberStatus, Family } from "@/types";
import { useToast } from "@/components/admin/Toast";
import { adminFetch } from "@/lib/adminFetch";

const roleLabels: Record<MemberRole, string> = {
  lead: "Lead",
  coordinator: "Coordinator",
  volunteer: "Volunteer",
};

const roleColors: Record<MemberRole, string> = {
  lead: "bg-terracotta/10 text-terracotta-dark",
  coordinator: "bg-amber-warm/10 text-amber-warm",
  volunteer: "bg-sage/10 text-sage",
};

interface MemberFormData {
  name: string;
  role: MemberRole;
  email: string;
  phone: string;
  status: MemberStatus;
  assignedFamilyIds: string[];
  joinedDate: string;
  notes: string;
}

const emptyForm: MemberFormData = {
  name: "",
  role: "volunteer",
  email: "",
  phone: "",
  status: "active",
  assignedFamilyIds: [],
  joinedDate: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function AdminTeamPage() {
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, familiesRes] = await Promise.all([
        adminFetch("/api/admin/team"),
        adminFetch("/api/admin/families"),
      ]);
      if (membersRes.ok) setMembers(await membersRes.json());
      if (familiesRes.ok) setFamilies(await familiesRes.json());
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const familyName = (id: string) =>
    families.find((f) => f.id === id)?.pseudonym || "Unknown";

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditing(member);
      setFormData({
        name: member.name,
        role: member.role,
        email: member.email || "",
        phone: member.phone || "",
        status: member.status,
        assignedFamilyIds: [...(member.assignedFamilyIds || [])],
        joinedDate: member.joinedDate || emptyForm.joinedDate,
        notes: member.notes || "",
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  const toggleFamily = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedFamilyIds: prev.assignedFamilyIds.includes(id)
        ? prev.assignedFamilyIds.filter((f) => f !== id)
        : [...prev.assignedFamilyIds, id],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      const url = editing ? `/api/admin/team/${editing.id}` : "/api/admin/team";
      const method = editing ? "PUT" : "POST";
      const res = await adminFetch(url, {
        method,
        json: formData,
      });

      if (res.ok) {
        const saved = await res.json();
        if (editing) {
          setMembers((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
        } else {
          setMembers((prev) => [...prev, saved]);
        }
        toast.success(editing ? "Member updated" : "Member added");
        handleCloseModal();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? `Couldn't save the member (${res.status}).`);
      }
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    try {
      const res = await adminFetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success("Member removed");
      } else {
        toast.error("Couldn't remove the member. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
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
    <div className="max-w-6xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-earth-dark tracking-tight">Team</h1>
          <p className="text-earth-mid text-sm mt-1">Manage volunteers and their assignments</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand shadow-sm py-16 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-terracotta" />
          </div>
          <h3 className="text-earth-dark font-semibold mb-1">No team members yet</h3>
          <p className="text-earth-mid text-sm mb-5">Add your first volunteer to build the roster.</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead>
              <tr className="bg-cream border-b border-sand">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Member</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Assigned</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-earth-mid uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta font-semibold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-earth-dark">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-earth-mid">
                    <div className="space-y-0.5">
                      {member.email && (
                        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-earth-light" />{member.email}</div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-earth-light" />{member.phone}</div>
                      )}
                      {!member.email && !member.phone && <span className="text-earth-light">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-earth-mid">
                    {member.assignedFamilyIds?.length
                      ? `${member.assignedFamilyIds.length} ${member.assignedFamilyIds.length === 1 ? "family" : "families"}`
                      : <span className="text-earth-light">None</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${member.status === "active" ? "bg-sage/10 text-sage" : "bg-sand text-earth-mid"}`}>
                      {member.status === "active" && <Check className="h-3 w-3" />}
                      {member.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <button onClick={() => handleOpenModal(member)} className="text-sage hover:text-sage/80 font-medium flex items-center gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sand sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-earth-dark">{editing ? "Edit Member" : "Add Member"}</h2>
              <button onClick={handleCloseModal} className="text-earth-light hover:text-earth-dark p-1.5 rounded-lg hover:bg-sand/50 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="e.g., Wei Chen"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as MemberRole }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark bg-white"
                  >
                    <option value="lead">Lead</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as MemberStatus }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Joined date</label>
                <input
                  type="date"
                  value={formData.joinedDate}
                  onChange={(e) => setFormData((p) => ({ ...p, joinedDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Assigned families</label>
                {families.length === 0 ? (
                  <p className="text-sm text-earth-light">No families to assign yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {families.map((f) => {
                      const checked = formData.assignedFamilyIds.includes(f.id);
                      return (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => toggleFamily(f.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${checked ? "bg-terracotta/10 border-terracotta/40 text-earth-dark" : "bg-white border-sand text-earth-mid hover:bg-cream/60"}`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? "bg-terracotta border-terracotta" : "border-sand-dark"}`}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </span>
                          {f.pseudonym}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Skills, availability, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-sand bg-cream/50 rounded-b-2xl">
              <button onClick={handleCloseModal} className="px-5 py-2.5 text-earth-mid bg-white border border-sand rounded-xl hover:bg-sand/50 font-medium text-sm shadow-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
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
