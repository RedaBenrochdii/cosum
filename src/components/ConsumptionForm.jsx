import React, { useEffect, useState } from 'react';
import styles from '../styles/ConsumptionForm.module.css';
import SmartUploader from './SmartUploader';
import axios from 'axios';

export function ConsumptionForm({
  formData,
  onMatriculeChange,
  onNomChange,
  onChange,
  onSubmit,
  setFormData,
  dependents = []
}) {
  const [matriculeTimeout, setMatriculeTimeout] = useState(null);
  const [childrenOptions, setChildrenOptions] = useState([]);

  const handleAutoFill = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
      Montant: data.Montant || prev.Montant,
      DateConsultation: data.DateConsultation || prev.DateConsultation,
    }));
  };

  const handleMatriculeBlur = () => {
    const matricule = formData.Matricule_Employe?.trim();
    if (!matricule) return;

    axios.get(`http://localhost:4000/api/employes/${matricule}`)
      .then(res => {
        const emp = res.data;
        setFormData((prev) => ({
          ...prev,
          Nom_Employe: emp.Nom_Employe || '',
          Prenom_Employe: emp.Prenom_Employe || '',
          Nom_Malade: emp.Nom_Employe || '',
          Prenom_Malade: emp.Prenom_Employe || '',
          DateConsultation: new Date().toISOString().split('T')[0]
        }));
      })
      .catch(err => {
        console.warn("Employé non trouvé :", err.response?.data?.error || err.message);
      });
  };

  useEffect(() => {
    if (matriculeTimeout) clearTimeout(matriculeTimeout);
    setMatriculeTimeout(setTimeout(handleMatriculeBlur, 600));
    return () => clearTimeout(matriculeTimeout);
  }, [formData.Matricule_Employe]);

  useEffect(() => {
    const fetchAyantDroitInfo = async () => {
      const matricule = formData.Matricule_Employe?.trim();
      const droit = formData.Ayant_Droit?.toLowerCase();

      if (!matricule || !['conjoint', 'enfant'].includes(droit)) return;

      try {
        if (droit === 'conjoint') {
  const res = await axios.get(`http://localhost:4000/api/employes/${matricule}/conjoint`);
  const conjoint = res.data;
  if (conjoint) {
    setFormData(prev => ({
      ...prev,
      Nom_Malade: conjoint.Nom_Conjoint || '',
      Prenom_Malade: conjoint.Prenom_Conjoint || ''
    }));
  }
}
 else if (droit === 'enfant') {
          const res = await axios.get(`http://localhost:4000/api/employes/${matricule}/enfants`);
          const enfants = res.data;
          setChildrenOptions(enfants);

          if (enfants.length === 1) {
            setFormData(prev => ({
              ...prev,
              Nom_Malade: prev.Nom_Employe,
              Prenom_Malade: enfants[0].Prenom_Enfant || ''
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              Nom_Malade: prev.Nom_Employe,
              Prenom_Malade: ''
            }));
          }
        }
      } catch (err) {
        console.error("Erreur remplissage Ayant Droit :", err.message);
      }
    };

    fetchAyantDroitInfo();
  }, [formData.Ayant_Droit, formData.Matricule_Employe]);

  const handleSelectChild = (e) => {
    const selected = childrenOptions.find(child => child.Prenom_Enfant === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        Nom_Malade: prev.Nom_Employe,
        Prenom_Malade: selected.Prenom_Enfant
      }));
    }
  };

  return (
    <>
      <SmartUploader onAutoFill={handleAutoFill} />

      <form onSubmit={onSubmit} className={styles.form}>
        <input
          name="Matricule_Employe"
          value={formData.Matricule_Employe}
          onChange={onMatriculeChange}
          placeholder="Matricule Employé"
          required
          className={styles.input}
        />

        <input
          list="noms-employes"
          name="Nom_Employe"
          value={formData.Nom_Employe}
          onChange={onNomChange}
          placeholder="Nom Employé"
          required
          className={styles.input}
        />
        <datalist id="noms-employes">
          {dependents.map((emp, i) => (
            <option key={i} value={emp.Nom_Employe} />
          ))}
        </datalist>

        <input
          name="Prenom_Employe"
          value={formData.Prenom_Employe}
          onChange={onChange}
          placeholder="Prénom Employé"
          required
          className={styles.input}
        />

        <input
          type="date"
          name="DateConsultation"
          value={formData.DateConsultation}
          onChange={onChange}
          required
          className={styles.input}
        />

        <input
          name="Nom_Malade"
          value={formData.Nom_Malade}
          onChange={onChange}
          placeholder="Nom Malade"
          className={styles.input}
        />

        {childrenOptions.length > 1 ? (
          <select onChange={handleSelectChild} className={styles.input}>
            <option value="">-- Choisir l’enfant --</option>
            {childrenOptions.map((child, i) => (
              <option key={i} value={child.Prenom_Enfant}>
                {child.Prenom_Enfant}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="Prenom_Malade"
            value={formData.Prenom_Malade}
            onChange={onChange}
            placeholder="Prénom Malade"
            className={styles.input}
          />
        )}

        <select
          name="Type_Malade"
          value={formData.Type_Malade}
          onChange={onChange}
          required
          className={styles.input}
        >
          <option value="">-- Type consultation --</option>
          <option value="médicale">Médicale</option>
          <option value="optique">Optique</option>
          <option value="dentaire">Dentaire</option>
        </select>

        <input
          type="number"
          name="Montant"
          value={formData.Montant}
          onChange={onChange}
          placeholder="Montant"
          className={styles.input}
        />

        <input
          type="number"
          name="Montant_Rembourse"
          value={formData.Montant_Rembourse}
          onChange={onChange}
          placeholder="Montant Remboursé"
          className={styles.input}
        />

        <input
          name="Code_Assurance"
          value={formData.Code_Assurance}
          onChange={onChange}
          placeholder="Code Assurance"
          className={styles.input}
        />

        <input
          type="text"
          name="Numero_Declaration"
          value={formData.Numero_Declaration}
          onChange={onChange}
          placeholder="Numéro de déclaration"
          required
          className={styles.input}
        />

        <select
          name="Ayant_Droit"
          value={formData.Ayant_Droit}
          onChange={onChange}
          required
          className={styles.input}
        >
          <option value="">-- Ayant droit --</option>
          <option value="employe">Employé</option>
          <option value="conjoint">Conjoint</option>
          <option value="enfant">Enfant</option>
        </select>

        <button type="submit" className={styles.button}>
          Ajouter
        </button>
      </form>
    </>
  );
}
