import React, { useEffect, useState } from 'react';
import styles from '../styles/FormPage.module.css';
import axios from 'axios';

export default function ProductionDashboard() {
  const [employes, setEmployes] = useState([]);
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [newMember, setNewMember] = useState({ nom: '', prenom: '', type: '' });
  const [newEmploye, setNewEmploye] = useState({ Matricule_Employe: '', Nom_Employe: '', Prenom_Employe: '' });

  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = () => {
    axios.get('http://localhost:4000/api/employes')
      .then(res => setEmployes(res.data))
      .catch(console.error);
  };

  const selectedEmploye = employes.find(emp => emp.Matricule_Employe === selectedMatricule);

const handleAddMember = async () => {
  if (!newMember.nom || !newMember.type || !selectedMatricule) {
    return alert("⚠️ Nom, Type et matricule requis !");
  }

  try {
    const response = await axios.post(`http://localhost:4000/api/employes/${selectedMatricule}/famille/add`, newMember);

    if (response.data.success) {
      fetchEmployes(); // recharger les employés après ajout
      setNewMember({ nom: '', prenom: '', type: '' });
    } else {
      alert("❌ " + (response.data.error || "Erreur lors de l’ajout."));
    }
  } catch (err) {
    console.error('Erreur ajout membre famille :', err);
    alert("❌ Erreur serveur.");
  }
};

  const handleDeleteMember = async (index) => {
    const updated = employes.map(emp => {
      if (emp.Matricule_Employe === selectedMatricule) {
        const newList = [...(emp.Famille || [])];
        newList.splice(index, 1);
        return { ...emp, Famille: newList };
      }
      return emp;
    });
    await saveChanges(updated);
  };

  const handleDeleteEmploye = async () => {
    if (!selectedMatricule) return;
    const updated = employes.filter(emp => emp.Matricule_Employe !== selectedMatricule);
    await saveChanges(updated);
    setSelectedMatricule('');
  };

 const handleAddEmploye = async () => {
  if (!newEmploye.Matricule_Employe || !newEmploye.Nom_Employe) {
    return alert("⚠️ Matricule et Nom requis !");
  }

  try {
    const response = await axios.post('http://localhost:4000/api/employes/add', {
      ...newEmploye,
      Famille: []
    });

    if (response.data.success) {
      fetchEmployes(); // recharger depuis le backend après ajout
      setNewEmploye({ Matricule_Employe: '', Nom_Employe: '', Prenom_Employe: '' });
    } else {
      alert("❌ " + (response.data.error || "Erreur lors de l’ajout."));
    }
  } catch (err) {
    console.error('Erreur ajout employé :', err);
    alert("❌ Erreur lors de l’ajout de l’employé.");
  }
};


  const saveChanges = async (updatedData) => {
    try {
      await axios.post('http://localhost:4000/api/employes/update', updatedData);
      setEmployes(updatedData);
    } catch (err) {
      console.error('Erreur sauvegarde :', err);
      alert("❌ Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestion Situation Familiale</h2>

      <div className={styles.form}>
        <h3>➕ Ajouter un nouvel employé</h3>
        <input placeholder="Matricule" value={newEmploye.Matricule_Employe}
          onChange={e => setNewEmploye({ ...newEmploye, Matricule_Employe: e.target.value })}
          className={styles.input} />
        <input placeholder="Nom" value={newEmploye.Nom_Employe}
          onChange={e => setNewEmploye({ ...newEmploye, Nom_Employe: e.target.value })}
          className={styles.input} />
        <input placeholder="Prénom" value={newEmploye.Prenom_Employe}
          onChange={e => setNewEmploye({ ...newEmploye, Prenom_Employe: e.target.value })}
          className={styles.input} />
        <button onClick={handleAddEmploye} className={styles.primaryButton}>Ajouter Employé</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>Sélectionner un employé :</label><br />
        <select
          value={selectedMatricule}
          onChange={(e) => setSelectedMatricule(e.target.value)}
          className={styles.input}
        >
          <option value="">-- Choisir un matricule --</option>
          {employes.map((emp, i) => (
            <option key={i} value={emp.Matricule_Employe}>
              {emp.Matricule_Employe} - {emp.Nom_Employe} {emp.Prenom_Employe}
            </option>
          ))}
        </select>
      </div>

      {selectedEmploye && (
        <>
          <h3 className={styles.subtitle}>👨‍👩‍👧‍👦 Famille de {selectedEmploye.Nom_Employe}</h3>
          <ul>
            {(selectedEmploye.Famille || []).map((f, i) => (
              <li key={i}>
                👤 {f.type} : {f.nom} {f.prenom}
                <button onClick={() => handleDeleteMember(i)} style={{ marginLeft: '10px', color: 'red' }}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.form}>
            <input placeholder="Nom" value={newMember.nom}
              onChange={e => setNewMember({ ...newMember, nom: e.target.value })}
              className={styles.input} />
            <input placeholder="Prénom" value={newMember.prenom}
              onChange={e => setNewMember({ ...newMember, prenom: e.target.value })}
              className={styles.input} />
            <select value={newMember.type}
              onChange={e => setNewMember({ ...newMember, type: e.target.value })}
              className={styles.input}
            >
              <option value="">-- Type --</option>
              <option value="conjoint">Conjoint(e)</option>
              <option value="enfant">Enfant</option>
              <option value="autre">Autre</option>
            </select>
            <button onClick={handleAddMember} className={styles.primaryButton}>➕ Ajouter à la famille</button>
            <button onClick={handleDeleteEmploye} className={styles.dangerButton}>🗑️ Supprimer Employé</button>
          </div>
        </>
      )}
    </div>
  );
}
