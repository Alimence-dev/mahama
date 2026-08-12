import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../constants/roles';

const ROLES = [
  { name: 'Admin', description: 'Registers users and manages system configuration.' },
  { name: 'Volunteer', description: 'Registers families and distributes resources.' },
  { name: 'Manager', description: 'Reviews resource requests and forwards them to donors.' },
  { name: 'Donor', description: 'Approves or rejects resource requests.' },
  { name: 'Refugees', description: 'Families served by the camp — represented as records managed by volunteers, not a login role.' },
];

export default function Landing() {
  const { user, token } = useAuth();

  if (user && token) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return (
    <div className="landing">
      <p className="brand">Mahama Camp</p>
      <h1>Resource Distribution System</h1>
      <p className="tagline">Managing resource distribution for Mahama Refugee Camp</p>
      <Link to="/login" className="cta">Log in</Link>

      <div className="role-grid">
        {ROLES.map((r) => (
          <div className="role-card" key={r.name}>
            <h3>{r.name}</h3>
            <p>{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
