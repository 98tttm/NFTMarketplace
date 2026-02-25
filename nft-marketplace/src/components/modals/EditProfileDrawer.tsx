"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save, Loader2 } from "lucide-react";

export interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  twitter: string;
  instagram: string;
  website: string;
  avatar: string;
  cover: string;
}

interface EditProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors";

export function EditProfileDrawer({ open, onClose, profile, onSave }: EditProfileDrawerProps) {
  const [form, setForm] = useState<ProfileData>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(profile);
  }, [open, profile]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function update(key: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(`profile-${profile.username}`, JSON.stringify(form));
      onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(key: "avatar" | "cover") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        update(key, url);
      }
    };
    input.click();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
              <h2 className="text-lg font-bold text-text-primary">Edit Profile</h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Cover upload */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Cover Image</label>
                <button
                  type="button"
                  onClick={() => handleImageUpload("cover")}
                  className="relative w-full h-28 rounded-xl border-2 border-dashed border-border bg-surface overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  {form.cover && (
                    <img src={form.cover} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </button>
              </div>

              {/* Avatar upload */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Avatar</label>
                <button
                  type="button"
                  onClick={() => handleImageUpload("avatar")}
                  className="relative h-20 w-20 rounded-full border-2 border-dashed border-border bg-surface overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  {form.avatar ? (
                    <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera size={18} className="text-white" />
                  </div>
                </button>
              </div>

              {/* Fields */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Display Name</label>
                <input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Your display name" className={inputCls} />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Username</label>
                <input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="@username" className={inputCls} />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Bio</label>
                <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} maxLength={200} placeholder="Tell the world about yourself" className={inputCls + " resize-none"} />
                <p className="text-right text-[10px] text-text-muted mt-1">{form.bio.length}/200</p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Twitter URL</label>
                <input value={form.twitter} onChange={(e) => update("twitter", e.target.value)} placeholder="https://twitter.com/username" className={inputCls} />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Instagram URL</label>
                <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/username" className={inputCls} />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Website</label>
                <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://yoursite.com" className={inputCls} />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
