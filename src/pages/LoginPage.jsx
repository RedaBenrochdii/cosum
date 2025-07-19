import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../assets/cosumar-logo.png';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // ⏳
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ⏳ Start loading

    try {
      const res = await api.post('/login', { username, password });
      if (res.data.success) {
        localStorage.setItem('loggedIn', 'true');
        navigate('/');
      } else {
        alert('Identifiants invalides');
      }
    } catch (error) {
      alert("Erreur lors de l'authentification");
      console.error(error);
    } finally {
      setLoading(false); // ✅ End loading
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <img src={Logo} alt="COSUMAR" className={styles.logo} />
        <h1 className={styles.title}>Connexion</h1>

        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className={styles.footer}>© COSUMAR 2025 – Tous droits réservés</p>
      </form>
    </div>
  );
}
