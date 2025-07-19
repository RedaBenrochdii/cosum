import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import axios from 'axios';

const extractFieldsFromText = (text) => {
  const patterns = {
    Matricule_Employe: /Matricule\s*[_]?\s*Employe?\s*[:]?\s*(\w+)/i,
    Nom_Employe: /Nom\s*[_]?\s*Employe?\s*[:]?\s*([A-Za-zÀ-ÿ- ]+)/i,
    Prenom_Employe: /Pr[ée]nom\s*[_]?\s*Employe?\s*[:]?\s*([A-Za-zÀ-ÿ- ]+)/i,
    Nom_Malade: /Nom\s*[_]?\s*Malade?\s*[:]?\s*([A-Za-zÀ-ÿ- ]+)/i,
    Prenom_Malade: /Pr[ée]nom\s*[_]?\s*Malade?\s*[:]?\s*([A-Za-zÀ-ÿ- ]+)/i,
    Type_Malade: /Type\s*[_]?\s*Malade?\s*[:]?\s*([A-Za-zÀ-ÿ]+)/i,
    Montant: /Montant\s*[:]?\s*([\d\s,\.]+)/i,
    Montant_Rembourse: /Rembours[ée]\s*[:]?\s*([\d\s,\.]+)/i,
    Code_Assurance: /Code\s*[_]?\s*Assurance?\s*[:]?\s*(\w+)/i,
    Numero_Declaration: /(?:Numéro|N°)\s*[_]?\s*D[ée]claration\s*[:]?\s*(\w+)/i,
    DateConsultation: /Date\s*[_]?\s*Consultation?\s*[:]?\s*(\d{4}-\d{2}-\d{2})/i
  };

  return Object.fromEntries(
    Object.entries(patterns).map(([key, regex]) => [
      key,
      (text.match(regex)?.[1]?.trim() || '')
    ])
  );
};

export default function OCRScanner({ onAutoFill }) {
  const [status, setStatus] = useState('');
  const [ocrMethod, setOcrMethod] = useState('gemini'); // gemini ou tesseract
  const workerRef = React.useRef(null);

  useEffect(() => {
    const initializeWorker = async () => {
      workerRef.current = await createWorker('fra');
    };
    initializeWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (ocrMethod === 'tesseract') {
      setStatus('Traitement local avec Tesseract...');
      try {
        const { data: { text } } = await workerRef.current.recognize(file);
        const fields = extractFieldsFromText(text);
        const cleanedFields = Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [key, value.replace(/['"]/g, '')])
        );
        onAutoFill(cleanedFields);
        setStatus('Champs extraits localement !');
      } catch (error) {
        console.error("Erreur OCR Tesseract:", error);
        setStatus('Erreur Tesseract');
      }
    } else {
      setStatus('Envoi à Gemini...');
      const formData = new FormData();
      formData.append('file', file);


      try {
        const response = await axios.post('http://localhost:4000/api/ocr/gemini', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onAutoFill(response.data);
        setStatus('Champs extraits par Gemini !');
      } catch (error) {
        console.error("Erreur OCR Gemini:", error);
        setStatus('Erreur Gemini');
        alert('Une erreur est survenue lors de l\'analyse par l\'IA.');
      }
    }
  };

  return (
    <div className="ocr-section" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <h3>OCR : Choisir une méthode</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="radio"
            name="ocrMethod"
            value="gemini"
            checked={ocrMethod === 'gemini'}
            onChange={() => setOcrMethod('gemini')}
          /> IA Gemini (serveur)
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="ocrMethod"
            value="tesseract"
            checked={ocrMethod === 'tesseract'}
            onChange={() => setOcrMethod('tesseract')}
          /> Local (Tesseract.js)
        </label>
      </div>

      <label className="ocr-upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={status.includes('...')
            || ocrMethod === 'tesseract' && !workerRef.current}
        />
        <span className="ocr-button">
          {status.includes('...') ? 'Traitement en cours...' : ''}
        </span>
      </label>

      {status && <div className="ocr-status" style={{ marginTop: '0.5rem' }}>Statut : {status}</div>}
    </div>
  );
}
