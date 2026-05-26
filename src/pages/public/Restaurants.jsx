import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Star, SlidersHorizontal, X,
  Utensils, UtensilsCrossed, ArrowRight, ChevronDown,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

const CUISINE_CHIPS = [
  'Pizza', 'Sushi', 'Couscous', 'Burger', 'Pasta',
  'Tajine', 'Seafood', 'Grill', 'Vegan', 'Café',
];

const SORT_OPTIONS = [
  { value: '-rating',     labelKey: 'restaurants.sort.topRated' },
  { value: '-reviewCount', labelKey: 'restaurants.sort.mostReviewed' },
  { value: 'name',         labelKey: 'restaurants.sort.nameAZ' },
];

export default function Restaurants() {
  const { t } = useTranslation('public');
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]   = useState(searchParams.get('search') || '');
  const [city,   setCity]     = useState(searchParams.get('city')   || '');
  const [halal,  setHalal]    = useState(false);
  const [cuisine, setCuisine] = useState('');
  const [sort,    setSort]    = useState('-rating');
  const [page,    setPage]    = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const PER_PAGE = 12;

  /* sync URL → state on mount */
  useEffect(() => {
    const q = searchParams.get('search') || '';
    const c = searchParams.get('city')   || '';
    if (q) setSearch(q);
    if (c) setCity(c);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const params = {
    ...(search   && { search }),
    ...(city     && { city }),
    ...(halal    && { halal: true }),
    ...(cuisine  && { cuisine }),
    sort,
    page,
    limit: PER_PAGE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['restaurants-browse', params],
    queryFn: () => restaurantService.getAll(params),
    keepPreviousData: true,
  });

  const restaurants = data?.data || [];
  const total       = data?.total || restaurants.length;
  const hasMore     = restaurants.length >= PER_PAGE;

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
  }

  function clearSearch() {
    setSearch('');
    setCity('');
    setPage(1);
  }

  const isFiltered = search || city || halal || cuisine;

  return (
    <div className="min-h-screen">

      {/* ── Top hero banner ── */}
      <div className="relative bg-gradient-to-br from-gray-950 via-[#1a0800] to-orange-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 start-1/4 w-72 h-72 bg-orange-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 end-1/4 w-56 h-56 bg-amber-500/15 rounded-full blur-[80px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
            {t('restaurants.hero.title')}
          </h1>
          <p className="text-gray-300 mb-8 text-[15px]">{t('restaurants.hero.subtitle')}</p>

          {/* search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3">
                <Search size={16} className="text-orange-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('restaurants.hero.searchPlaceholder')}
                  className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 sm:w-40">
                <MapPin size={16} className="text-orange-400 shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('restaurants.hero.cityPlaceholder')}
                  className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-orange-500/30 whitespace-nowrap"
              >
                {t('restaurants.hero.searchBtn')}
              </button>
            </div>
          </form>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </div>

      {/* ── Filter + Sort bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/5 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none">

          {/* Halal toggle */}
          <button
            onClick={() => { setHalal(!halal); setPage(1); }}
            className={[
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150',
              halal
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400',
            ].join(' ')}
          >
            ✓ Halal
          </button>

          {/* cuisine chips */}
          {CUISINE_CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => { setCuisine(cuisine === c ? '' : c); setPage(1); }}
              className={[
                'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 whitespace-nowrap',
                cuisine === c
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-orange-500',
              ].join(' ')}
            >
              {c}
            </button>
          ))}

          {/* spacer */}
          <div className="flex-1 shrink-0" />

          {/* sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-orange-500 transition-all whitespace-nowrap"
            >
              <SlidersHorizontal size={13} />
              {t(currentSort.labelKey)}
              <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute end-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setSort(o.value); setPage(1); setSortOpen(false); }}
                    className={[
                      'w-full text-start px-3.5 py-2 text-xs font-medium transition-colors',
                      sort === o.value
                        ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/30'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5',
                    ].join(' ')}
                  >
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* clear all */}
          {isFiltered && (
            <button
              onClick={clearSearch}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            >
              <X size={12} /> {t('restaurants.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* results count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isFiltered
                ? t('restaurants.resultsCount', { count: restaurants.length })
                : t('restaurants.allCount', { count: total })}
            </p>
            {isFetching && !isLoading && (
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState onClear={clearSearch} isFiltered={isFiltered} t={t} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map((r) => (
                <RestaurantCard key={r._id} r={r} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-800 text-gray-700 dark:text-gray-300 hover:text-orange-500 px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isFetching ? (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t('restaurants.loadMore')
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Restaurant card ── */
function RestaurantCard({ r }) {
  return (
    <Link
      to={`/r/${r.slug}`}
      className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-400 hover:-translate-y-1 flex flex-col"
    >
      {/* cover */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shrink-0">
        {r.coverImage
          ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" />
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <Utensils size={36} className="text-orange-200 dark:text-orange-800" />
            </div>
          )
        }

        {r.isHalal && (
          <span className="absolute top-3 start-3 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
            Halal
          </span>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{r.name}</h3>
        {r.cuisine?.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{r.cuisine.join(' · ')}</p>
        )}

        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={11}
                className={s <= Math.round(r.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-current'} />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{(r.rating || 0).toFixed(1)}</span>
          <span className="text-xs text-gray-400">({r.reviewCount || 0})</span>
          {r.address?.city && (
            <span className="text-xs text-gray-400 ms-auto flex items-center gap-0.5">
              <MapPin size={10} />{r.address.city}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center gap-1 text-orange-500 dark:text-orange-400 text-xs font-bold group-hover:gap-2 transition-all duration-200">
          View Menu <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 animate-pulse">
      <div className="h-48 bg-gray-100 dark:bg-gray-800" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/3 mt-3" />
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ onClear, isFiltered, t }) {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
        <UtensilsCrossed size={36} className="text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">{t('restaurants.emptyTitle')}</h3>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-6 max-w-xs mx-auto">{t('restaurants.emptyDesc')}</p>
      {isFiltered && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {t('restaurants.clearFilters')}
        </button>
      )}
    </div>
  );
}
