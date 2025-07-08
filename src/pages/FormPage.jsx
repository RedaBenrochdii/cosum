import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { ConsumptionForm } from '../components/ConsumptionForm';
import { DataTable } from '../components/DataTable';
import OCRScanner from '../components/OCRScanner';
import styles from '../styles/FormPage.module.css';
import SmartUploader from '../components/SmartUploader';

const INITIAL_FORM_STATE = {
  DateConsultation: '',
  Matricule_Employe: '',
  Nom_Employe: '',
  Prenom_Employe: '',
  Nom_Malade: '',
  Prenom_Malade: '',
  Type_Malade: '',
  Montant: '',
  Montant_Rembourse: '',
  Code_Assurance: '',
  Numero_Declaration: '',
  Ayant_Droit: ''
};

const EXPORT_FIELDS = Object.keys(INITIAL_FORM_STATE);

export default function FormPage() {
  const [employesData, setEmployesData] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formList, setFormList] = useLocalStorage('formList', []);
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [blockSubmit, setBlockSubmit] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    axios.get('http://localhost:4000/api/employes')
      .then(res => setEmployesData(res.data))
      .catch(err => console.error('Erreur chargement employés :', err));
  }, []);

  const handleAutoFill = useCallback(fields => {
    setFormData(prev => ({
      ...prev,
      ...fields,
      Montant: fields.Montant?.replace(/\s+/g, '') || '',
      DateConsultation: fields.DateConsultation || new Date().toISOString().split('T')[0]
    }));
  }, []);

  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const autoFillFromEmploye = useCallback((field, value) => {
    const emp = employesData.find(x => x[field]?.toLowerCase() === value.toLowerCase());
    if (emp) {
      setFormData(prev => ({
        ...prev,
        ...emp,
        DateConsultation: emp.DateConsultation?.split('T')[0] || prev.DateConsultation
      }));
    }
  }, [employesData]);

  const handleMatriculeChange = useCallback(e => {
    const value = e.target.value;
    updateFormData('Matricule_Employe', value);
    autoFillFromEmploye('Matricule_Employe', value);
  }, [autoFillFromEmploye, updateFormData]);

  const handleNomChange = useCallback(e => {
    const value = e.target.value;
    updateFormData('Nom_Employe', value);
    autoFillFromEmploye('Nom_Employe', value);
  }, [autoFillFromEmploye, updateFormData]);

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    updateFormData(name, value);

    // 🚨 Vérifie la date de consultation
    if (name === 'DateConsultation') {
      const inputDate = new Date(value);
      const now = new Date();
      const diff = (now - inputDate) / (1000 * 60 * 60 * 24); // en jours

      if (diff > 90) {
        setAlertDate('⚠️ La date dépasse 3 mois.');
        setBlockSubmit(true);
      } else {
        setAlertDate('');
        setBlockSubmit(false);
      }
    }
  }, [updateFormData]);

  const handleSubmit = useCallback(e => {
    e.preventDefault();
    if (blockSubmit) {
      alert('❌ Impossible d’enregistrer : la date dépasse 3 mois.');
      return;
    }
    setFormList(prev => [...prev, formData]);
    setFormData(INITIAL_FORM_STATE);
  }, [formData, setFormList, blockSubmit]);

  const handleDelete = useCallback(idx => {
    setFormList(prev => prev.filter((_, i) => i !== idx));
  }, [setFormList]);

  const handleDeleteAll = useCallback(() => {
    if (window.confirm('Supprimer toutes les entrées ?')) {
      setFormList([]);
    }
  }, [setFormList]);

  const handleEdit = useCallback((item, idx) => {
    if (window.confirm('Modifier cette entrée ?')) {
      setFormData(item);
      setFormList(prev => prev.filter((_, i) => i !== idx));
    }
  }, [setFormList]);

  const exportExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(formList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    XLSX.writeFile(wb, 'DonneesMutuelle.xlsx');
  }, [formList]);

  const handleOpenGmail = useCallback(() => {
    if (!formList.length) {
      return alert('Aucune donnée à exporter');
    }
    exportExcel();
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=wafaassurance@gmail.com&su=Données+Mutuelle&body=Bonjour,%0D%0AVeuillez+trouver+ci-joint+les+données.`,
      '_blank'
    );
  }, [formList, exportExcel]);

  return (
    <div className={styles.container}>
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '6px 12px',
            background: 'var(--button-bg)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {darkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
        </button>
      </div>

      <h1 className={styles.title}>Gestion Mutuelle</h1>

      <OCRScanner onAutoFill={handleAutoFill} className={styles.ocrSection} />

      <ConsumptionForm
        formData={formData}
        onMatriculeChange={handleMatriculeChange}
        onNomChange={handleNomChange}
        onChange={handleChange}
        onSubmit={handleSubmit}
        dependents={employesData}
        showDateWarning={!!alertDate}
      />

      {/* Notification Date */}
      {alertDate && (
        <div style={{
          marginTop: '10px',
          padding: '12px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba',
          borderRadius: '6px'
        }}>
          {alertDate}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setShowCalc(!showCalc)}
          style={{
            padding: '8px 12px',
            background: '#f3f3f3',
            border: '1px solid #ccc',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🧮 Ouvrir la calculatrice
        </button>

        {showCalc && (
          <div style={{
            marginTop: '10px',
            background: 'var(--card-bg)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            width: '260px',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.1)'
          }}>
            <input
              type="text"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              placeholder="Ex: 150+300+90"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                fontSize: '16px'
              }}
            />
            <div>
              <button
                onClick={() => {
                  try {
                    const result = eval(calcInput);
                    setCalcInput(result.toString());
                  } catch {
                    alert("Erreur de calcul");
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '8px'
                }}
              >
                = Calculer
              </button>

              <button
                onClick={() => setCalcInput('')}
                style={{
                  padding: '6px 12px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Effacer
              </button>
            </div>
          </div>
        )}
      </div>

      <DataTable
        data={formList}
        columns={EXPORT_FIELDS}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onEdit={handleEdit}
      />

      <div className={styles.actions}>
        <button
          onClick={handleOpenGmail}
          disabled={!formList.length}
          className={styles.primaryButton}
        >
          Exporter vers Gmail
        </button>
      </div>
    </div>
  );
}
