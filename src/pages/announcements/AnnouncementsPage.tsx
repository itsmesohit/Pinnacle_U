import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Search, Edit2, Trash2, Calendar, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement
} from '@/lib/dataService';
import { Announcement, AnnouncementFormData } from '@/types';
import { format } from 'date-fns';

export function AnnouncementsPage() {
  const { user, isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null);

  const announcements = getAnnouncements();

  // Filter based on user role and query
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      // Role permission check: students see 'all' and 'students'; teachers see 'all' and 'teachers'
      if (user?.role === 'student' && a.audience === 'teachers') return false;
      if (user?.role === 'teacher' && a.audience === 'students') return false;

      const matchesAudience = audienceFilter === 'all' || a.audience === audienceFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);

      return matchesAudience && matchesSearch;
    });
  }, [announcements, user, audienceFilter, search]);

  const handleFormSubmit = (data: AnnouncementFormData) => {
    if (editingItem) {
      updateAnnouncement(editingItem.id, data);
    } else {
      createAnnouncement(data, user?.id || 'admin');
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      deleteAnnouncement(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const audienceBadges: Record<string, { label: string; variant: 'default' | 'info' | 'warning' }> = {
    all: { label: 'All Campus', variant: 'default' },
    teachers: { label: 'Faculty Only', variant: 'warning' },
    students: { label: 'Students Only', variant: 'info' },
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Announcements & Notices</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Campus bulletins, academic dates, examination deadlines, and administrative alerts.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <Plus size={15} /> Post Announcement
          </Button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bulletins and notifications..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {isAdmin && (
          <select
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="teachers">Faculty Only</option>
            <option value="students">Students Only</option>
          </select>
        )}
      </div>

      {/* Announcements Stream */}
      {filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map(item => {
            const aud = audienceBadges[item.audience] || audienceBadges.all;
            return (
              <Card key={item.id} className="p-5 hover:border-primary/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={aud.variant}>{aud.label}</Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 whitespace-pre-line">
                      {item.message}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => setDeletingItem(item)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description="There are currently no active bulletins matching your filters."
        />
      )}

      <AnnouncementFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement"
        description="Are you sure you want to remove this announcement bulletin?"
        confirmLabel="Delete Notice"
      />
    </div>
  );
}
