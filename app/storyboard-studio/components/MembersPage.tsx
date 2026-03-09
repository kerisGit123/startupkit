"use client";

import { useState } from "react";
import { UserPlus, Search, Hash, Pencil, Plus, MoreHorizontal } from "lucide-react";
import { TAG_COLORS } from "../constants";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Member" | "Viewer";
  avatar: string;
  tags: string[];
}

const SAMPLE_MEMBERS: Member[] = [
  { id: "m1", name: "Alex",  email: "alex@studio.io",  role: "Administrator", avatar: "A", tags: ["Motion Designer"] },
  { id: "m2", name: "Anna",  email: "anna@studio.io",  role: "Member",        avatar: "A", tags: [] },
  { id: "m3", name: "Not registered yet", email: "flora@fauna.io", role: "Member", avatar: "?", tags: [] },
];

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>(SAMPLE_MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagPickerId, setTagPickerId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTag = (memberId: string) => {
    if (!newTagName.trim()) return;
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, tags: [...m.tags, newTagName.trim()] } : m
    ));
    setNewTagName("");
    setTagPickerId(null);
  };

  const handleRemoveTag = (memberId: string, tag: string) => {
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, tags: m.tags.filter(t => t !== tag) } : m
    ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
          <UserPlus className="w-4 h-4" /> Invite members
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#1c1c26] border border-white/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none w-32"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-[#111118] border border-white/6 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6 text-left">
                <th className="px-4 py-3 text-gray-500 text-xs font-medium">Name</th>
                <th className="px-4 py-3 text-gray-500 text-xs font-medium">Email</th>
                <th className="px-4 py-3 text-gray-500 text-xs font-medium">Role</th>
                <th className="px-4 py-3 text-gray-500 text-xs font-medium">Tags</th>
                <th className="px-4 py-3 text-gray-500 text-xs font-medium w-16"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} className="border-b border-white/4 hover:bg-white/2 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
                        {member.avatar}
                      </div>
                      <span className="text-white text-sm font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{member.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{member.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 relative">
                      {member.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-[10px] font-medium inline-flex items-center gap-1 group/tag">
                          <Hash className="w-2.5 h-2.5" />
                          {tag}
                          <button onClick={() => handleRemoveTag(member.id, tag)} className="opacity-0 group-hover/tag:opacity-100 ml-0.5 text-orange-400 hover:text-white transition">×</button>
                        </span>
                      ))}
                      <button onClick={() => setTagPickerId(tagPickerId === member.id ? null : member.id)}
                        className="p-1 text-gray-600 hover:text-gray-400 transition">
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Tag picker dropdown */}
                      {tagPickerId === member.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setTagPickerId(null)} />
                          <div className="absolute left-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-52 p-3">
                            <div className="flex items-center gap-2 bg-[#25252f] border border-white/8 rounded-lg px-2.5 py-1.5 mb-2">
                              <Search className="w-3 h-3 text-gray-500" />
                              <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddTag(member.id)}
                                placeholder="Search" className="bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none flex-1" autoFocus />
                            </div>
                            {/* Existing tags */}
                            {member.tags.map(t => (
                              <div key={t} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-orange-500/10 mb-1">
                                <span className="text-orange-300 text-xs flex-1">{t}</span>
                                <span className="text-green-400 text-xs">✓</span>
                                <button className="text-gray-500 hover:text-white transition"><Pencil className="w-2.5 h-2.5" /></button>
                              </div>
                            ))}
                            {/* Color picker */}
                            <div className="flex flex-wrap gap-1.5 my-2">
                              {TAG_COLORS.map(c => (
                                <button key={c} onClick={() => setNewTagColor(c)} aria-label={`Color ${c}`}
                                  className={`w-5 h-5 rounded transition ${newTagColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#1c1c26]" : ""}`}
                                  style={{ backgroundColor: c }} />
                              ))}
                            </div>
                            <button onClick={() => handleAddTag(member.id)}
                              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-gray-400 hover:text-white text-xs border border-white/10 rounded-lg hover:bg-white/5 transition">
                              <Plus className="w-3 h-3" /> Create new tag
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-gray-500 hover:text-white transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          On this page, you can manage the team of the current workspace. All team members can view and comment on all projects.
          You can invite external collaborators or reviewers at the project level.
        </p>
        <p className="text-center text-gray-600 text-xs mt-1">
          {filtered.length} of {members.length}
        </p>
      </div>
    </div>
  );
}
