'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Trash2,
  Tag,
  Plus,
  X,
  AlertTriangle,
  Zap,
  Activity,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountSettingsManager() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; name?: string; role?: string } | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [trackedTopics, setTrackedTopics] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setPlan(data.plan);
          setTrackedTopics(data.trackedTopics || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrackedTopics([...trackedTopics, data.topic]);
        setNewTopic('');
      }
    } catch {}
  };

  const handleRemoveTopic = async (topicName: string) => {
    try {
      const res = await fetch(`/api/topics?topic=${encodeURIComponent(topicName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTrackedTopics(trackedTopics.filter((t) => t.topic !== topicName));
      }
    } catch {}
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        setFeedbackMsg('Your account and private data have been completely deleted.');
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch {
      alert('Error during account deletion');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground py-4">Loading account details...</div>;
  }

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          {feedbackMsg}
        </div>
      )}

      {/* Plan & Usage Allowance */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Commercial Plan & Allowances</span>
          </div>
          <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
            {plan?.planTier || 'Free'} Plan
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded border border-border/70 bg-background/50 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">AI Requests Limit</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{plan?.aiRequestsLimit || 100} / day</p>
          </div>
          <div className="rounded border border-border/70 bg-background/50 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Personal Briefings</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{plan?.briefingsLimit || 10} / day</p>
          </div>
          <div className="rounded border border-border/70 bg-background/50 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tracked Topics Limit</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{plan?.trackedTopicsLimit || 20} topics</p>
          </div>
        </div>
      </div>

      {/* Tracked Topics */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Actively Tracked Topics ({trackedTopics.length})</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tracked topics prioritize matching developments in your briefings and feeds while maintaining source diversity.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {trackedTopics.map((t) => (
            <span
              key={t.topic}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium"
            >
              {t.topic}
              <button
                type="button"
                onClick={() => handleRemoveTopic(t.topic)}
                className="hover:text-red-400"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {trackedTopics.length === 0 && (
            <span className="text-xs text-muted-foreground">No specific topics tracked yet.</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Track new topic (e.g. Model Context Protocol)..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTopic();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddTopic}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="rounded-lg border border-red-500/20 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400 pb-2 border-b border-border">
          <AlertTriangle size={15} />
          <span>Danger Zone: Account Deletion</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently delete your user profile, bookmarks, saved intelligence, feedback, and telemetry.
          Global intelligence records remain completely untouched.
        </p>

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={13} />
          Delete Account & Personal Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <AlertTriangle size={22} />
              <h3 className="text-base font-bold">Confirm Permanent Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to delete your account? This will immediately erase all your
              profile preferences, saved bookmarks, feedback ratings, and private telemetry.
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-md border border-border bg-accent px-4 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
