import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME, ROLE_LABELS } from '../constants/roles';

// Shared chrome for every authenticated page: brand, role/name, logout, optional
// back-link and section nav — so navigation reads the same everywhere in the app.
export default function PageHeader({ title, backTo, backLabel = 'Back', nav }) {
  const { user, logout } = useAuth();

  return (
    <header className="page-header">
      <div className="page-header-bar">
        <Link to={ROLE_HOME[user.role]} className="brand">Mahama Camp</Link>
        <div className="page-header-user">
          <span className="role-pill">{ROLE_LABELS[user.role]}</span>
          <span className="user-name">{user.name}</span>
          <button type="button" className="btn-secondary" onClick={logout}>Log out</button>
        </div>
      </div>

      {backTo && (
        <Link to={backTo} className="back-link">&larr; {backLabel}</Link>
      )}

      <h1>{title}</h1>

      {nav && nav.length > 0 && (
        <nav className="page-nav">
          {nav.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
