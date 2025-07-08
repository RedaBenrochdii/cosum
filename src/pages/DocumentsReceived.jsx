import React, { useEffect, useState } from 'react';
import Logo from '../assets/cosumar-logo.png';

const API_BASE = 'http://localhost:4000';

export default function DocumentsReceived() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/documents`)
      .then((res) => res.json())
      .then(setDocuments)
      .catch(console.error);
  }, []);

  const docsFiltres = search
    ? documents.filter(doc =>
        doc.nom && doc.nom.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  return (
    
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#005eb8] mb-4">📥 Documents reçus</h1>
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6 p-2 border border-blue-200 rounded w-full max-w-sm"
      />

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {docsFiltres.map((doc, idx) => (
          <div key={doc.filename} className="border rounded-lg shadow p-4 bg-white">
            <img
              src={`${API_BASE}/uploads/${doc.filename}`}
              alt={doc.filename}
              className="w-full h-48 object-cover rounded"
            />
            <p className="mt-2 font-semibold text-[#005eb8]">Commentaire :</p>
            <p>{doc.commentaire}</p>
            <p className="text-sm text-gray-600 mt-1">Date : {new Date(doc.date).toLocaleString('fr-FR')}</p>
            <a
              href={`${API_BASE}/uploads/${doc.filename}`}
              download
              className="inline-block mt-3 px-4 py-2 bg-[#005eb8] text-white rounded text-sm"
            >
              Télécharger
            </a>
          </div>
          
        ))}
      </div>
    </div>
  );
}
