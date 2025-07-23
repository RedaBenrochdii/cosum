// 🔐 .env
require('dotenv').config();
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Clé Gemini manquante dans .env");
  process.exit(1);
}

// 🌐 Dépendances
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const XLSX = require('xlsx');
const uploadRoute = require('./routes/uploadRoute');

// 📁 Chemins
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

// ✅ Initialisation serveur
const app = express();
const PORT = 4000;

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', uploadRoute);

// 📁 Dossiers
const EMPLOYES_FILE = path.join(__dirname, 'data', 'employes.json');
const DATA_FILE = path.join(__dirname, 'documents.json');
const uploadDir = path.join(__dirname, 'uploads');
const bordereauxDir = path.join(__dirname, 'bordereaux');
const bordereauxHistoryFile = path.join(__dirname, 'data', 'bordereaux.json');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(bordereauxDir);
app.use('/uploads', express.static(uploadDir));
app.use('/bordereaux', express.static(bordereauxDir));

// 🔐 Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'cosumar' && password === 'cosumar@2025') {
    return res.status(200).json({ success: true, token: 'token123' });
  }
  res.status(401).json({ success: false, message: "Identifiants invalides" });
});

// 📋 Employés
app.get('/api/employes', (_, res) => {
  try {
    const data = fs.readJsonSync(EMPLOYES_FILE);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Erreur lecture employés' });
  }
});

app.post('/api/employes/add', (req, res) => {
  try {
    const newEmp = req.body;
    const data = fs.existsSync(EMPLOYES_FILE) ? fs.readJsonSync(EMPLOYES_FILE) : [];
    if (data.some(e => e.Matricule_Employe === newEmp.Matricule_Employe)) {
      return res.status(409).json({ success: false, error: 'Employé déjà existant' });
    }
    data.push(newEmp);
    fs.writeFileSync(EMPLOYES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, message: 'Employé ajouté', employe: newEmp });
  } catch (err) {
    res.status(500).json({ error: 'Erreur ajout employé', details: err.message });
  }
});

app.post('/api/employes/:matricule/famille/add', (req, res) => {
  const { matricule } = req.params;
  const newMember = req.body;
  try {
    const data = fs.readJsonSync(EMPLOYES_FILE);
    const emp = data.find(e => e.Matricule_Employe === matricule);
    if (!emp) return res.status(404).json({ error: 'Employé introuvable' });
    emp.Famille = emp.Famille || [];
    emp.Famille.push(newMember);
    fs.writeFileSync(EMPLOYES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, message: 'Membre famille ajouté' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

app.get('/api/employes/:matricule', (req, res) => {
  const { matricule } = req.params;
  try {
    const data = fs.readJsonSync(EMPLOYES_FILE);
    const emp = data.find(e => e.Matricule_Employe === matricule);
    if (!emp) return res.status(404).json({ error: 'Employé introuvable' });
    res.json(emp);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/employes/:matricule/conjoint', (req, res) => {
  const { matricule } = req.params;
  try {
    const data = fs.readJsonSync(EMPLOYES_FILE);
    const emp = data.find(e => e.Matricule_Employe === matricule);
    const conjoint = emp?.Famille?.find(f => f.type === 'conjoint');
    if (conjoint) {
      res.json({ Nom_Conjoint: emp.Nom_Employe, Prenom_Conjoint: conjoint.prenom });
    } else {
      res.status(404).json({ error: 'Aucun conjoint trouvé' });
    }
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/employes/:matricule/enfants', (req, res) => {
  const { matricule } = req.params;
  try {
    const data = fs.readJsonSync(EMPLOYES_FILE);
    const emp = data.find(e => e.Matricule_Employe === matricule);
    const enfants = emp?.Famille?.filter(f => f.type === 'enfant') || [];
    res.json(enfants.map(e => ({ Nom_Enfant: emp.Nom_Employe, Prenom_Enfant: e.prenom, DateNaissance: e.DateNaissance })));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 📥 Upload fichiers
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const doc = {
      filename: req.file.filename,
      commentaire: req.body.commentaire,
      date: new Date().toISOString()
    };
    const oldData = fs.existsSync(DATA_FILE) ? await fs.readJson(DATA_FILE) : [];
    oldData.push(doc);
    await fs.writeJson(DATA_FILE, oldData, { spaces: 2 });
    res.json({ success: true, message: 'Document reçu' });
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/documents', async (_, res) => {
  try {
    const data = await fs.readJson(DATA_FILE);
    res.json(data);
  } catch {
    res.json([]);
  }
});

// 🤖 Gemini OCR
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/ocr/gemini', upload.single('image'), async (req, res) => {
  try {
    const base64 = await fs.readFile(req.file.path, { encoding: 'base64' });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { text: "Voici un document de mutuelle. Extrais les champs sous forme JSON..." },
      { inlineData: { data: base64, mimeType: req.file.mimetype } }
    ]);
    const text = result.response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return res.json({ error: "Texte non JSON", texte: text });
    const extracted = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json(extracted);
  } catch {
    res.status(500).json({ error: 'Erreur OCR Gemini' });
  }
});

// 📤 Export Excel (nouveau bordereau)
app.post('/api/export-bordereau', async (req, res) => {
  try {
    const dossiers = req.body;
    if (!Array.isArray(dossiers) || dossiers.length === 0)
      return res.status(400).json({ error: "Aucun dossier à exporter" });

    const now = new Date();
    const filename = `bordereau_${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`;
    const filepath = path.join(bordereauxDir, filename);

    const ws = XLSX.utils.json_to_sheet(dossiers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bordereau");
    XLSX.writeFile(wb, filepath);

    const nbDossiers = dossiers.length;
    const total = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant || 0), 0).toFixed(2);
    const rembourse = dossiers.reduce((sum, d) => sum + parseFloat(d.Montant_Rembourse || 0), 0).toFixed(2);

    const historique = fs.existsSync(bordereauxHistoryFile)
      ? fs.readJsonSync(bordereauxHistoryFile)
      : [];

    historique.unshift({
      id: `BORD-${historique.length + 1}`,
      filename,
      date: now.toISOString(),
      nbDossiers,
      total,
      rembourse
    });
    fs.writeJsonSync(bordereauxHistoryFile, historique, { spaces: 2 });

    res.json({ success: true, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur export bordereau" });
  }
});

// 📜 Historique unifié des bordereaux
app.get('/api/bordereaux', (_, res) => {
  try {
    const raw = fs.readJsonSync(bordereauxHistoryFile);
    const data = raw.map(item => {
      // nbDossiers : nouveau champ ou ancien "nombre" ou longueur de "dossiers"
      const nb = item.nbDossiers ?? item.nombre ?? (item.dossiers?.length ?? 0);
      // total : on garde tel quel
      const total = parseFloat(item.total || 0).toFixed(2);
      // rembourse : nouveau champ ou calcul depuis "dossiers"
      const rembourse = item.rembourse
        ? parseFloat(item.rembourse).toFixed(2)
        : (
            item.dossiers?.reduce(
              (sum, d) => sum + parseFloat(d.Montant_Rembourse || 0),
              0
            ) ?? 0
          ).toFixed(2);

      return {
        id: item.id,
        filename: item.filename || '',
        date: item.date,
        nbDossiers: nb,
        total,
        rembourse
      };
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lecture bordereaux' });
  }
});

// ✅ Route test
app.get('/', (_, res) => res.send('✅ Backend JSON opérationnel'));

// 🚀 Lancement serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> Backend CosuMutuel démarré sur le port ${PORT}`);
  console.log(`✅ Serveur backend JSON lancé sur http://localhost:${PORT}`);
});
