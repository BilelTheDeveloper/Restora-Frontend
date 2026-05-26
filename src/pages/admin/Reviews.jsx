import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Plus, X, Send, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reviewService } from '../../services/reviewService';
import toast from 'react-hot-toast';

const SOURCE_CONFIG = {
  google:      { label: 'Google',      color: '#4285f4', emoji: '🔵' },
  tripadvisor: { label: 'TripAdvisor', color: '#34e0a1', emoji: '🟢' },
  facebook:    { label: 'Facebook',    color: '#1877f2', emoji: '🔷' },
  internal:    { label: 'Internal',    color: '#f97316', emoji: '🟠' },
  manual:      { label: 'Manual',      color: '#6b7280', emoji: '⚪' },
};

const SENTIMENT_CONFIG = {
  positive: { color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15', label: '😊 Positive' },
  neutral:  { color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15',   label: '😐 Neutral' },
  negative: { color: 'text-red-500',     bg: 'bg-red-100 dark:bg-red-500/15',       label: '😞 Negative' },
};

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-white/15'} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const qc = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ source: 'manual', reviewerName: '', rating: 5, text: '', date: new Date().toISOString().split('T')[0] });

  const params = { page, limit: 20, ...(sourceFilter !== 'all' && { source: sourceFilter }), ...(sentimentFilter !== 'all' && { sentiment: sentimentFilter }) };
  const { data: reviewsData, isLoading } = useQuery({ queryKey: ['reviews', params], queryFn: () => reviewService.getReviews(params).then(r => r.data) });
  const { data: stats } = useQuery({ queryKey: ['review-stats'], queryFn: () => reviewService.getStats().then(r => r.data) });

  const replyMutation = useMutation({
    mutationFn: ({ id, text }) => reviewService.reply(id, { replyText: text }),
    onSuccess: () => { toast.success('Reply saved'); qc.invalidateQueries(['reviews']); setReplyModal(null); setReplyText(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const createReview = useMutation({
    mutationFn: (data) => reviewService.create(data),
    onSuccess: () => { toast.success('Review added'); qc.invalidateQueries(['reviews']); qc.invalidateQueries(['review-stats']); setShowAddModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteReview = useMutation({
    mutationFn: (id) => reviewService.remove(id),
    onSuccess: () => { toast.success('Review removed'); qc.invalidateQueries(['reviews']); qc.invalidateQueries(['review-stats']); },
  });

  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData?.pages || 1;
  const ratingDist = stats?.ratingDistribution?.map(r => ({ rating: `${r._id}★`, count: r.count })).sort((a, b) => a.rating.localeCompare(b.rating)) || [];

  const REPLY_TEMPLATES = [
    'Thank you for your wonderful feedback! We hope to see you again soon.',
    "We're sorry to hear about your experience. Please contact us so we can make it right.",
    'Thank you for taking the time to share your thoughts. Your feedback helps us improve.',
    "We're thrilled you enjoyed your visit! Come back soon for more great experiences.",
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Review & Reputation</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Monitor reviews across all platforms, reply & track sentiment</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> Add Review
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">Overall Rating</span>
              <Star size={17} className="text-yellow-400" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.avgRating}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.totalReviews.toLocaleString()} total reviews</div>
            <StarRating rating={Math.round(stats.avgRating)} />
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">Recent (30d)</span>
              <TrendingUp size={17} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.recentAvg}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.recentCount} new reviews</div>
            <StarRating rating={Math.round(stats.recentAvg)} />
          </div>
          {stats.bySentiment?.map(s => {
            const cfg = SENTIMENT_CONFIG[s._id] || {};
            return (
              <div key={s._id} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5">
                <div className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">{cfg.label || s._id}</div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{s.count}</div>
                <div className={`text-xs font-semibold mt-1 ${cfg.color}`}>{((s.count / stats.totalReviews) * 100).toFixed(0)}% of all</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating distribution */}
      {ratingDist.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ratingDist} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal />
              <XAxis dataKey="rating" tick={{ fontSize: 12, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v, 'Reviews']} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}
                fill="url(#ratingGrad)"
                label={{ position: 'top', style: { fontSize: 11, fill: 'rgba(156,163,175,1)' } }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
          {[['all', 'All Sources'], ...Object.entries(SOURCE_CONFIG).map(([k, v]) => [k, v.emoji + ' ' + v.label])].map(([id, label]) => (
            <button key={id} onClick={() => { setSourceFilter(id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sourceFilter === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
          {[['all', 'All'], ['positive', '😊 Positive'], ['neutral', '😐 Neutral'], ['negative', '😞 Negative']].map(([id, label]) => (
            <button key={id} onClick={() => { setSentimentFilter(id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sentimentFilter === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          : reviews.length === 0 ? <div className="text-center py-16 text-gray-400">No reviews yet for this filter</div>
          : reviews.map((r) => {
            const src = SOURCE_CONFIG[r.source] || SOURCE_CONFIG.manual;
            const sent = SENTIMENT_CONFIG[r.sentiment] || {};
            return (
              <motion.div key={r._id} layout className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 hover:border-orange-500/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${src.color}15` }}>{src.emoji}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{r.reviewerName || 'Anonymous'}</span>
                        <StarRating rating={r.rating} size={12} />
                        {r.sentiment && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sent.bg} ${sent.color}`}>{r.sentiment}</span>}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{src.label}</span>
                        <span>·</span>
                        <span>{new Date(r.date).toLocaleDateString()}</span>
                        {r.replied && <span className="text-emerald-500 font-semibold">· Replied</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!r.replied && (
                      <button onClick={() => { setReplyModal(r); setReplyText(''); }} className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 hover:bg-blue-200 transition-colors">
                        <MessageSquare size={11} /> Reply
                      </button>
                    )}
                    <button onClick={() => { if (confirm('Delete?')) deleteReview.mutate(r._id); }} className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center"><X size={12} /></button>
                  </div>
                </div>
                {r.text && <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{r.text}</p>}
                {r.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.categories.map(c => <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/40 capitalize">{c.replace('_', ' ')}</span>)}
                  </div>
                )}
                {r.replied && r.replyText && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-white/4 rounded-xl border-l-2 border-orange-400">
                    <div className="text-xs font-semibold text-orange-500 mb-1">Your Reply</div>
                    <p className="text-sm text-gray-600 dark:text-white/55">{r.replyText}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5">← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500 dark:text-white/40">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5">Next →</button>
        </div>
      )}

      {/* Reply Modal */}
      <AnimatePresence>
        {replyModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setReplyModal(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Reply to Review</h3>
                <button onClick={() => setReplyModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/4 rounded-xl mb-4">
                <StarRating rating={replyModal.rating} />
                <p className="text-sm text-gray-600 dark:text-white/55 mt-1">{replyModal.text || '(No text)'}</p>
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Quick Templates</label>
                <div className="space-y-1">
                  {REPLY_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => setReplyText(t)} className="w-full text-left text-xs p-2 rounded-lg bg-gray-50 dark:bg-white/4 text-gray-600 dark:text-white/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 transition-colors">{t.slice(0, 80)}...</button>
                  ))}
                </div>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Write your reply..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none resize-none" />
              <button onClick={() => replyMutation.mutate({ id: replyModal._id, text: replyText })} disabled={!replyText || replyMutation.isPending}
                className="w-full mt-3 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Send size={14} /> {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Review Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Add Manual Review</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Source</label>
                    <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {Object.entries(SOURCE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Rating</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setAddForm(f => ({ ...f, rating: n }))}
                          className={`flex-1 py-1.5 rounded-lg text-sm transition-all ${addForm.rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-400'}`}>★</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Reviewer Name</label>
                  <input value={addForm.reviewerName} onChange={e => setAddForm(f => ({ ...f, reviewerName: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Review Text</label>
                  <textarea value={addForm.text} onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))} rows={3}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Date</label>
                  <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>
              </div>
              <button onClick={() => createReview.mutate(addForm)} disabled={createReview.isPending}
                className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createReview.isPending ? 'Adding...' : 'Add Review'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
