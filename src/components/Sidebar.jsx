import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';
import logo from '../assets/logo.png';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    navigate('/login');
  };

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
      </div>
      <ul className={styles.menu}>
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Accueil
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Documents reçus
          </NavLink>
        </li>
        <li>
          <NavLink to="/form" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Formulaire
          </NavLink>
        </li>
        <li>
          <NavLink to="/reclamation" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Production
          </NavLink>
        </li>
        <li>
          <NavLink to="/bordereau" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Bordereau
          </NavLink>
        </li>
        <li>
          <button onClick={handleLogout} className={styles.logoutLink}>
            Se déconnecter
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
