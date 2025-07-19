import React, { useEffect, useState } from 'react';
import styles from '../styles/FormPage.module.css';
import axios from 'axios';

export default function ProductionDashboard() {
  const [employes, setEmployes] = useState([]);
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [blockSubmit, setBlockSubmit] = useState(false);

  const [newMember, setNewMember] = useState({ nom: '', prenom: '', type: '', dateNaissance: '' });
  const [newEmploye, setNewEmploye] = useState({
    Matricule_Employe: '',
    Nom_Employe: '',
    Prenom_Employe: '',
    DateNaissance: ''
  });

  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = () => {
    axios.get('http://localhost:4000/api/employes')
      .then(res => setEmployes(res.data))
      .catch(console.error);
  };

  const selectedEmploye = employes.find(emp => emp.Matricule_Employe === selectedMatricule);

  const calculateAge = (date) => {
    const birth = new Date(date);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleAddMember = async () => {
    if (!newMember.nom || !newMember.type || !selectedMatricule) {
      return alert("⚠️ Nom, Type et matricule requis !");
    }

    const age = calculateAge(newMember.dateNaissance);
    if (newMember.type === 'enfant' && age > 25) {
      setAlertDate(`❌ L'enfant a ${age} ans. Limite autorisée : 25 ans.`);
      return setBlockSubmit(true);
    }
    if (newMember.type === 'conjoint' && age > 60) {
      setAlertDate(`❌ Le conjoint a ${age} ans. Limite autorisée : 60 ans.`);
      return setBlockSubmit(true);
    }

    setAlertDate('');
    setBlockSubmit(false);

    try {
      const response = await axios.post(`http://localhost:4000/api/employes/${selectedMatricule}/famille/add`, newMember);
      if (response.data.success) {
        fetchEmployes();
        setNewMember({ nom: '', prenom: '', type: '', dateNaissance: '' });
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
        fetchEmployes();
        setNewEmploye({ Matricule_Employe: '', Nom_Employe: '', Prenom_Employe: '', DateNaissance: '' });
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

      {/* ➕ Formulaire ajout employé */}
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
        <input type="date" placeholder="Date de naissance"
          value={newEmploye.DateNaissance}
          onChange={e => setNewEmploye({ ...newEmploye, DateNaissance: e.target.value })}
          className={styles.input} />
        <button onClick={handleAddEmploye} className={styles.primaryButton}>Ajouter Employé</button>
      </div>

      {/* 🔍 Recherche d’employé */}
      <div style={{ marginTop: '20px' }}>
        <label>🔍 Recherche (matricule, nom ou prénom) :</label><br />
        <input type="text" placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.input}
        />
        <ul style={{ maxHeight: '200px', overflowY: 'auto', padding: 0 }}>
          {employes
            .filter(emp =>
              emp.Matricule_Employe.toLowerCase().includes(searchTerm.toLowerCase()) ||
              emp.Nom_Employe.toLowerCase().includes(searchTerm.toLowerCase()) ||
              emp.Prenom_Employe.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((emp, i) => (
              <li key={i}
                onClick={() => setSelectedMatricule(emp.Matricule_Employe)}
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  borderBottom: '1px solid #ccc',
                  backgroundColor: selectedMatricule === emp.Matricule_Employe ? '#e0f2fe' : '#fff'
                }}>
                {emp.Matricule_Employe} – {emp.Nom_Employe} {emp.Prenom_Employe}
              </li>
            ))}
        </ul>
      </div>

      {/* 👨‍👩‍👧‍👦 Affichage famille */}
      {selectedEmploye && (
        <>
          <h3 className={styles.subtitle}> Famille de {selectedEmploye.Nom_Employe}</h3>
          <ul>
            {(selectedEmploye.Famille || []).map((f, i) => (
              <li key={i}>
                {f.type} : {f.nom} {f.prenom} – {f.dateNaissance}
                <button onClick={() => handleDeleteMember(i)} style={{ marginLeft: '10px', color: 'red' }}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>

          {/* ✅ ESPACE clair ajouté ici */}
          <div style={{ marginTop: '25px' }} />

          {alertDate && <p style={{ color: 'red', fontWeight: 'bold' }}>{alertDate}</p>}

          <div className={styles.form}>
            <input placeholder="Nom" value={newMember.nom}
              onChange={e => setNewMember({ ...newMember, nom: e.target.value })}
              className={styles.input} />
            <input placeholder="Prénom" value={newMember.prenom}
              onChange={e => setNewMember({ ...newMember, prenom: e.target.value })}
              className={styles.input} />
            <input type="date" value={newMember.dateNaissance}
              onChange={e => setNewMember({ ...newMember, dateNaissance: e.target.value })}
              className={styles.input} />

            {newMember.dateNaissance && (
              <p style={{ fontSize: '14px', color: '#555' }}>
                Âge : {calculateAge(newMember.dateNaissance)} ans
              </p>
            )}

            <select value={newMember.type}
              onChange={e => setNewMember({ ...newMember, type: e.target.value })}
              className={styles.input}
            >
              <option value="">-- Type --</option>
              <option value="conjoint">Conjoint(e)</option>
              <option value="enfant">Enfant</option>
              <option value="autre">Autre</option>
            </select>
            <button onClick={handleAddMember} className={styles.primaryButton} disabled={blockSubmit}>
              Ajouter à la famille
            </button>
            <button onClick={handleDeleteEmploye} className={styles.dangerButton}>Supprimer Employé</button>
          </div>
        </>
      )}
    </div>
  );
}
