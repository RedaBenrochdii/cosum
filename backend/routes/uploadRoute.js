import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const HISTORY_FILE = path.join(__dirname, '..', 'history.json');

// Ajout d’un document dans l’historique
router.post('/api/history/add', async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    const history = fs.existsSync(HISTORY_FILE)
      ? await fs.readJson(HISTORY_FILE)
      : [];

    history.push({ filename, data });
    await fs.writeJson(HISTORY_FILE, history, { spaces: 2 });

    res.status(200).json({ success: true, message: '✅ Document ajouté à l’historique' });
  } catch (error) {
    console.error('Erreur ajout historique :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l’ajout à l’historique' });
  }
});

export default router;
