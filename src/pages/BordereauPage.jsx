import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/BordereauPage.module.css';

export default function BordereauPage() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [historique, setHistorique] = useState([]);

  // ✅ Charger les dossiers actuels (en cours)
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('formList') || '[]');
    setDossiers(data);
  }, []);

  // ✅ Charger les bordereaux précédemment exportés
  useEffect(() => {
    axios.get('http://localhost:4000/api/bordereaux')
      .then(res => setHistorique(res.data))
      .catch(() => setHistorique([]));
  }, []);

  const totalMontant = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant || 0), 0).toFixed(2);
  const montantRembourse = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant_Rembourse || 0), 0).toFixed(2);
  const parType = dossiers.reduce((acc, d) => {
    const type = d.Type_Malade || 'autre';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

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
        setMessage('✅ Export réussi. Téléchargement...');
        window.open(fileUrl, '_blank');

        // 🔄 Vider les dossiers actuels (optionnel si tu veux vider après export)
        localStorage.setItem('formList', '[]');
        setDossiers([]);

        // 🔄 Recharger l'historique après export
        const updatedHistory = await axios.get('http://localhost:4000/api/bordereaux');
        setHistorique(updatedHistory.data);
      } else {
        setMessage('❌ Erreur lors de la génération du bordereau.');
      }
    } catch (err) {
      setMessage('❌ Erreur serveur lors de l’export.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bordereauBox}>
        <h2 className={styles.title}>📋 Bordereau de Transmission</h2>

        <p><strong>Nombre de dossiers :</strong> {dossiers.length}</p>
        <p><strong>Période :</strong> 10/01/2025 → 03/07/2025</p>
        <p><strong>Total Montant :</strong> {totalMontant} MAD</p>
        <p><strong>Montant Remboursé :</strong> {montantRembourse} MAD</p>

        <p><strong>Répartition par type :</strong></p>
        <ul>
          {Object.entries(parType).map(([type, count]) => (
            <li key={type}><strong>{type}</strong> : {count} dossier(s)</li>
          ))}
        </ul>

        <button
          onClick={exportBordereau}
          className={styles.exportBtn}
          disabled={loading}
        >
          📥 Exporter le Bordereau
        </button>

        {message && <p className={styles.statusMsg}>{message}</p>}
      </div>

      {historique.length > 0 && (
        <div className={styles.historiqueBox}>
          <h3 className={styles.title}>📁 Historique des Bordereaux</h3>
          <ul className={styles.historyList}>
            {historique.map((b, idx) => (
              <li key={idx}>
                📄 <a href={`http://localhost:4000/bordereaux/${b.filename}`} target="_blank" rel="noopener noreferrer">
                  {b.id || b.filename}
                </a> — {new Date(b.date).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
