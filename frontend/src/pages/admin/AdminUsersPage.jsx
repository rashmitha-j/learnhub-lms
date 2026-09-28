import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { adminService } from '../../services/adminService';
import { formatDate, pluralize } from '../../utils/format';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Students' },
  { value: 'instructor', label: 'Instructors' },
  { value: 'admin', label: 'Admins' },
];

export default function AdminUsersPage() {
  useDocumentTitle('Users');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, loading, error, reload } = useApi(
    () => adminService.users({ search: debouncedSearch || undefined, role: role || undefined, page }),
    [debouncedSearch, role, page]
  );

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Admin accounts are promoted manually and cannot be created through registration."
      />

      <div className="card toolbar">
        <label className="toolbar-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search users"
            maxLength={100}
          />
        </label>
        <Select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          placeholder="All roles"
        />
      </div>

      {loading && !data ? (
        <LoadingSpinner label="Loading users…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : data.users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="Try a different search or role filter." />
      ) : (
        <>
          <p className="results-count muted">{pluralize(data.pagination.total, 'user')}</p>
          <div className="card table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <StatusBadge status={user.role} />
                      </td>
                      <td className="nowrap">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
