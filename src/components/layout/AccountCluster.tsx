import React from 'react';
import { Button } from '../forms/Button';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountCluster.module.css';

export interface AccountClusterProps {
  /** Render the username/Admin/Logout (or Login/Sign Up) cluster. Default
   *  true. Set false for a static page that wants no auth UI. */
  showAuth?: boolean;
}

/**
 * The suite's account block: username/Profile + Admin-if-admin + Logout, or
 * Login + Sign Up when logged out. Identical on every app — this is the one
 * place the Admin link lives now, gated directly on `user.role === 'admin'`,
 * so no app opts in or out of it individually.
 */
export const AccountCluster: React.FC<AccountClusterProps> = ({ showAuth = true }) => {
  const { user, isAuthenticated, logout, authEnabled } = useAuth();

  if (!showAuth) return null;

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (isAuthenticated) {
    return (
      <div className={styles.authCluster}>
        {user?.role === 'admin' && (
          <a href="/admin/users" className={styles.adminLink}>
            Admin
          </a>
        )}
        <a href="/profile" className={styles.userLink}>
          {user?.username}
        </a>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  if (!authEnabled) return null;

  return (
    <div className={styles.authCluster}>
      <a href="/login">
        <Button variant="ghost" size="sm">
          Login
        </Button>
      </a>
      <a href="/register">
        <Button variant="primary" size="sm">
          Sign Up
        </Button>
      </a>
    </div>
  );
};
