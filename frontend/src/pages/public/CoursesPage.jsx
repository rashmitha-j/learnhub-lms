import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import CourseGrid from '../../components/course/CourseGrid';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { courseService } from '../../services/courseService';
import { CATEGORIES, LEVELS, SORT_OPTIONS } from '../../utils/constants';
import { pluralize } from '../../utils/format';

const PAGE_SIZE = 9;
const FILTER_KEYS = ['search', 'category', 'level', 'sort'];

export default function CoursesPage() {
  useDocumentTitle('Courses');
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const level = params.get('level') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);

  // Keep the input in sync when the URL changes (back button, clear filters)
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  const { data, loading, error, reload } = useApi(
    () =>
      courseService.list({
        search: search || undefined,
        category: category || undefined,
        level: level || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    [search, category, level, sort, page]
  );

  // Changing any filter resets to page 1
  const updateParams = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in updates)) next.delete('page');
    setParams(next);
  };

  const hasFilters = FILTER_KEYS.some((key) => key !== 'sort' && params.get(key));
  const clearFilters = () => setParams(new URLSearchParams());

  const goToPage = (nextPage) => {
    updateParams({ page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h1>Find your next course</h1>
          <p className="muted">Search by topic, then narrow down by category and level.</p>
        </div>
      </div>

      <form
        className="filters card"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ search: searchInput.trim() });
        }}
      >
        <div className="filters-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search courses by title or description"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search courses"
            maxLength={100}
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </div>
        <div className="filters-row">
          <Select
            label="Category"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            options={CATEGORIES}
            placeholder="All categories"
          />
          <Select
            label="Level"
            value={level}
            onChange={(e) => updateParams({ level: e.target.value })}
            options={LEVELS}
            placeholder="All levels"
          />
          <Select
            label="Sort by"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
            options={SORT_OPTIONS}
          />
          <Button variant="ghost" icon={X} onClick={clearFilters} disabled={!hasFilters && sort === 'newest'}>
            Clear filters
          </Button>
        </div>
      </form>

      {loading && !data ? (
        <LoadingSpinner label="Loading courses…" />
      ) : error ? (
        <ErrorMessage title="Could not load courses" message={error} onRetry={reload} />
      ) : data.courses.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No courses found"
          message={hasFilters ? 'Try a different search term or remove some filters.' : 'No courses have been published yet.'}
          action={hasFilters && <Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <>
          <p className="results-count muted" aria-live="polite">
            {pluralize(data.pagination.total, 'course')} found
            {loading && ' · updating…'}
          </p>
          <CourseGrid courses={data.courses} />
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
