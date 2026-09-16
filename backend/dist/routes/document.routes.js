"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const docDir = process.env.VERCEL ? path_1.default.join('/tmp', 'Documents_GED') : path_1.default.join(__dirname, '../../../Documents_GED');
const metadataPath = path_1.default.join(docDir, 'metadata.json');
const getMetadata = () => {
    if (fs_1.default.existsSync(metadataPath)) {
        try {
            return JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf8'));
        }
        catch {
            return {};
        }
    }
    return {};
};
const saveMetadata = (data) => {
    try {
        if (!fs_1.default.existsSync(docDir))
            fs_1.default.mkdirSync(docDir, { recursive: true });
        fs_1.default.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
    }
    catch (e) {
        console.warn('[GED Store] Could not save metadata:', e);
    }
};
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.get('/', (req, res) => {
    try {
        if (!fs_1.default.existsSync(docDir)) {
            return res.json([]);
        }
        const files = fs_1.default.readdirSync(docDir).filter(f => f !== 'metadata.json');
        const metadata = getMetadata();
        const documents = files.map((file, index) => {
            const stats = fs_1.default.statSync(path_1.default.join(docDir, file));
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
router.delete('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path_1.default.join(docDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            const metadata = getMetadata();
            if (metadata[filename]) {
                delete metadata[filename];
                saveMetadata(metadata);
            }
            res.json({ message: 'File deleted successfully' });
        }
        else {
            res.status(404).json({ error: 'File not found' });
        }
    }
    catch (error) {
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
        if (req.body.title)
            metadata[filename].title = req.body.title;
        if (req.body.type)
            metadata[filename].type = req.body.type;
        if (req.body.machine)
            metadata[filename].machine = req.body.machine;
        saveMetadata(metadata);
        res.json({ message: 'Metadata updated successfully', metadata: metadata[filename] });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update metadata' });
    }
});
exports.default = router;
