import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const docDir = path.join(__dirname, '../../../Documents_GED');
const metadataPath = path.join(docDir, 'metadata.json');

const getMetadata = () => {
  if (fs.existsSync(metadataPath)) {
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
};

const saveMetadata = (data: any) => {
  fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    cb(null, docDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(docDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(docDir).filter(f => f !== 'metadata.json');
    const metadata = getMetadata();
    
    const documents = files.map((file, index) => {
      const stats = fs.statSync(path.join(docDir, file));
      const fileMeta = metadata[file] || {};
      
      return {
        id: index + 1,
        fileName: file,
        title: fileMeta.title || file,
        type: fileMeta.type || file.split('.').pop()?.toUpperCase() || 'Fichier',
        machine: fileMeta.machine || 'N/A',
        date: stats.birthtime.toLocaleDateString(),
        url: `/docs/${file}`
      };
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read documents' });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const metadata = getMetadata();
    metadata[req.file.originalname] = {
      title: req.body.title || req.file.originalname,
      type: req.body.type || req.file.originalname.split('.').pop()?.toUpperCase() || 'Fichier',
      machine: req.body.machine || 'N/A'
    };
    saveMetadata(metadata);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: Date.now(),
        fileName: req.file.originalname,
        title: metadata[req.file.originalname].title,
        type: metadata[req.file.originalname].type,
        machine: metadata[req.file.originalname].machine,
        date: new Date().toLocaleDateString(),
        url: `/docs/${req.file.originalname}`
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(docDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      const metadata = getMetadata();
      if (metadata[filename]) {
        delete metadata[filename];
        saveMetadata(metadata);
      }
      
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

router.put('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const metadata = getMetadata();
    if (!metadata[filename]) {
      metadata[filename] = {};
    }
    if (req.body.title) metadata[filename].title = req.body.title;
    if (req.body.type) metadata[filename].type = req.body.type;
    if (req.body.machine) metadata[filename].machine = req.body.machine;
    
    saveMetadata(metadata);
    res.json({ message: 'Metadata updated successfully', metadata: metadata[filename] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

export default router;
