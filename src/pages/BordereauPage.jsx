import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/BordereauPage.module.css';
import { DataTable } from '../components/DataTable';
import DailyConsumptionChart from '../components/DailyConsumptionChart';

export default function BordereauPage() {
  const [dossiers, setDossiers] = useState([]);
  const [filteredDossiers, setFilteredDossiers] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [filteredHistorique, setFilteredHistorique] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFilename, setLastFilename] = useState('');
  const [searchHistorique, setSearchHistorique] = useState('');
  const [searchDossiers, setSearchDossiers] = useState('');

  // Chargement initial des dossiers depuis localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('formList') || '[]');
    setDossiers(data);
    setFilteredDossiers(data);
  }, []);

  // Chargement de l'historique depuis l'API
  useEffect(() => {
    axios.get('http://localhost:4000/api/bordereaux')
      .then(res => {
        setHistorique(res.data);
        setFilteredHistorique(res.data);
        if (res.data.length > 0) {
          setLastFilename(res.data[res.data.length - 1].filename || '');
        }
      })
      .catch(() => {
        setHistorique([]);
        setFilteredHistorique([]);
      });
  }, []);

  // Utilitaire pour extraire la date d'un filename
  const extractDateFromFilename = filename => {
    if (typeof filename !== 'string') return '';
    const m = filename.match(/bordereau_(\d{4}-\d{2}-\d{2})-/);
    return m ? m[1] : '';
  };

  // Filtre de l'historique
  useEffect(() => {
    if (!searchHistorique) {
      setFilteredHistorique(historique);
    } else {
      const s = searchHistorique.toLowerCase();
      setFilteredHistorique(
        historique.filter(b =>
          extractDateFromFilename(b.filename).toLowerCase().includes(s) ||
          (b.filename && b.filename.toLowerCase().includes(s))
        )
      );
    }
  }, [searchHistorique, historique]);

  // Filtre des dossiers
  useEffect(() => {
    if (!searchDossiers) {
      setFilteredDossiers(dossiers);
    } else {
      const s = searchDossiers.toLowerCase();
      setFilteredDossiers(
        dossiers.filter(d =>
          d.Type_Malade?.toLowerCase().includes(s) ||
          d.Matricule_Employe?.toLowerCase().includes(s) ||
          d.Nom_Malade?.toLowerCase().includes(s) ||
          (d.DateConsultation &&
            new Date(d.DateConsultation).toLocaleDateString().toLowerCase().includes(s))
        )
      );
    }
  }, [searchDossiers, dossiers]);

  // Totaux et stats
  const totalMontant = filteredDossiers
    .reduce((sum, d) => sum + parseFloat(d.Montant || 0), 0)
    .toFixed(2);
  const montantRembourse = filteredDossiers
    .reduce((sum, d) => sum + parseFloat(d.Montant_Rembourse || 0), 0)
    .toFixed(2);
  const parType = filteredDossiers.reduce((acc, d) => {
    const t = d.Type_Malade?.toLowerCase() || 'autre';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const getIntervalDate = () => {
    if (!filteredDossiers.length) return '—';
    const dates = filteredDossiers
      .map(d => new Date(d.DateConsultation))
      .filter(d => !isNaN(d));
    if (!dates.length) return '—';
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return `${min.toLocaleDateString()} → ${max.toLocaleDateString()}`;
  };

  // Export du bordereau
  const exportBordereau = async () => {
    if (!dossiers.length) {
      setMessage('⚠️ Aucun dossier à exporter.');
      return;
    }
    try {
      setLoading(true);
      setMessage('📤 Export en cours...');
      const res = await axios.post(
        'http://localhost:4000/api/export-bordereau',
        dossiers
      );
      if (res.data.success && res.data.filename) {
        window.open(
          `http://localhost:4000/bordereaux/${res.data.filename}`,
          '_blank'
        );
        setMessage('✅ Export réussi.');
        localStorage.setItem('formList', '[]');
        setDossiers([]);
        setFilteredDossiers([]);
        setLastFilename(res.data.filename);
        const updated = await axios.get('http://localhost:4000/api/bordereaux');
        setHistorique(updated.data);
        setFilteredHistorique(updated.data);
      } else {
        setMessage('❌ Erreur lors de la génération du bordereau.');
      }
    } catch {
      setMessage('❌ Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Actions dossier
  const handleDelete = idx => {
    const nd = [...filteredDossiers];
    nd.splice(idx, 1);
    setFilteredDossiers(nd);
    setDossiers(nd);
  };
  const handleDeleteAll = () => {
    setFilteredDossiers([]);
    setDossiers([]);
  };
  const handleEdit = (item, idx) => {
    alert(`Modifier dossier : ${item.Nom_Malade} (index ${idx})`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bordereau de Transmission</h1>

      {/* Résumé */}
      <div className={styles.summaryBox}>
        <p><strong>Nom du fichier :</strong> {lastFilename || '—'}</p>
        <p><strong>Période :</strong> {getIntervalDate()}</p>
        <p><strong>Nombre de dossiers :</strong> {filteredDossiers.length}</p>
        <p><strong>Total Montant :</strong> {totalMontant} MAD</p>
        <p><strong>Montant Remboursé :</strong> {montantRembourse} MAD</p>
        <div style={{ marginTop: 12 }}>
          <strong>Répartition par type :</strong>
          <ul>
            {Object.entries(parType).map(([type, count]) => (
              <li key={type}>
                {type} : {count} dossier{count > 1 && 's'}
              </li>
            ))}
          </ul>
        </div>
        <button
          className={styles.primaryButton}
          onClick={exportBordereau}
          disabled={loading}
        >
          Exporter le Bordereau
        </button>
        {message && <p className={styles.status}>{message}</p>}
      </div>

      {/* Recherche dossiers */}
      <div className={styles.searchBox}>
        <label htmlFor="searchDossiers">
          <strong>Rechercher dossier :</strong>
        </label><br />
        <input
          id="searchDossiers"
          type="text"
          placeholder="Matricule, type ou date..."
          value={searchDossiers}
          onChange={e => setSearchDossiers(e.target.value)}
          className={styles.inputSearch}
        />
      </div>

      {/* Tableau des dossiers */}
      <DataTable
        data={filteredDossiers}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onEdit={handleEdit}
      />

      {/* Graphique de consommation historique */}
      <section className={styles.chartSection}>
        <h2 className={styles.subtitle}>Graphique de consommation</h2>
        <DailyConsumptionChart data={filteredHistorique} />
      </section>

      {/* Recherche historique */}
      <div className={styles.searchBox}>
        <label htmlFor="searchHistorique">
          <strong>Rechercher dans l'historique :</strong>
        </label><br />
        <input
          id="searchHistorique"
          type="text"
          placeholder="Nom du fichier ou date..."
          value={searchHistorique}
          onChange={e => setSearchHistorique(e.target.value)}
          className={styles.inputSearch}
        />
      </div>

      {/* Historique sous forme de table */}
      {filteredHistorique.length > 0 && (
        <div className={styles.historyBox}>
          <h2 className={styles.subtitle}>📁 Historique des Bordereaux</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fichier</th>
                <th>Date</th>
                <th>Nombre de Dossiers</th>
                <th>Total (MAD)</th>
                <th>Remboursé (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistorique.map((b, i) => (
                <tr key={i}>
                  <td>
                    <a
                      href={`http://localhost:4000/bordereaux/${b.filename}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {b.filename}
                    </a>
                  </td>
                  <td>{new Date(b.date).toLocaleString()}</td>
                  <td>{b.nbDossiers}</td>
                  <td>{parseFloat(b.total || 0).toFixed(2)}</td>
                  <td>{parseFloat(b.rembourse || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
