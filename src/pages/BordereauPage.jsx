import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/BordereauPage.module.css';

export default function BordereauPage() {
  const [dossiers, setDossiers] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFilename, setLastFilename] = useState('');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('formList') || '[]');
    setDossiers(data);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:4000/api/bordereaux')
      .then(res => {
        setHistorique(res.data);
        if (res.data.length > 0) {
          const latest = res.data[res.data.length - 1];
          setLastFilename(latest.filename || '');
        }
      })
      .catch(() => setHistorique([]));
  }, []);

  const totalMontant = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant || 0), 0).toFixed(2);
  const montantRembourse = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant_Rembourse || 0), 0).toFixed(2);

  const parType = dossiers.reduce((acc, d) => {
    const type = d.Type_Malade?.toLowerCase() || 'autre';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const getIntervalDate = () => {
    if (dossiers.length === 0) return '—';
    const dates = dossiers
      .map(d => new Date(d.DateConsultation))
      .filter(d => !isNaN(d));
    if (dates.length === 0) return '—';
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return `${min.toLocaleDateString()} → ${max.toLocaleDateString()}`;
  };

  const exportBordereau = async () => {
    if (dossiers.length === 0) {
      setMessage('⚠️ Aucun dossier à exporter.');
      return;
    }

    try {
      setLoading(true);
      setMessage('📤 Export en cours...');

      const res = await axios.post('http://localhost:4000/api/export-bordereau', dossiers);
      if (res.data.success && res.data.filename) {
        const fileUrl = `http://localhost:4000/bordereaux/${res.data.filename}`;
        window.open(fileUrl, '_blank');
        setMessage('✅ Export réussi.');

        localStorage.setItem('formList', '[]');
        setDossiers([]);
        setLastFilename(res.data.filename);

        const updated = await axios.get('http://localhost:4000/api/bordereaux');
        setHistorique(updated.data);
      } else {
        setMessage('❌ Erreur lors de la génération du bordereau.');
      }
    } catch (err) {
      setMessage('❌ Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📋 Bordereau de Transmission</h1>

      <div className={styles.summaryBox}>
        <p><strong>Nom du fichier :</strong> {lastFilename || '—'}</p>
        <p><strong>Période :</strong> {getIntervalDate()}</p>
        <p><strong>Nombre de dossiers :</strong> {dossiers.length}</p>
        <p><strong>Total Montant :</strong> {totalMontant} MAD</p>
        <p><strong>Montant Remboursé :</strong> {montantRembourse} MAD</p>

        <div style={{ marginTop: '1rem' }}>
          <strong>Répartition par type :</strong>
          <ul>
            {Object.entries(parType).map(([type, count]) => (
              <li key={type}>{type} : {count} dossier(s)</li>
            ))}
          </ul>
        </div>

        <button className={styles.primaryButton} onClick={exportBordereau} disabled={loading}>
          📥 Exporter le Bordereau
        </button>
        {message && <p className={styles.status}>{message}</p>}
      </div>

      {historique.length > 0 && (
        <div className={styles.historyBox}>
          <h2 className={styles.subtitle}>📁 Historique des Bordereaux</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fichier</th>
                <th>Date</th>
                <th>Nombre de Dossiers</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((b, i) => (
                <tr key={i}>
                  <td>
                    <a href={`http://localhost:4000/bordereaux/${b.filename}`} target="_blank" rel="noreferrer">
                      {b.filename}
                    </a>
                  </td>
                  <td>{new Date(b.date).toLocaleString()}</td>
                  <td>{b.nbDossiers}</td>
                  <td>{parseFloat(b.total || 0).toFixed(2)} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
