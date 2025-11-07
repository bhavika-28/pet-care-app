const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp + original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        // Allow images, PDFs, and common document types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and documents are allowed!'));
        }
    }
});

// Get all health records for a pet
router.get('/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        const [records] = await db.query("SELECT * FROM health_records WHERE petId = ? OR pet_id = ? ORDER BY date DESC", [petId, petId]);
        res.json({ success: true, records });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching records" });
    }
});

// Add a new health record with optional file upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { petId, type, name, notes, date, vet_clinic } = req.body;
        
        let file_path = null;
        let file_name = null;
        
        if (req.file) {
            file_path = `/uploads/${req.file.filename}`;
            file_name = req.file.originalname;
        }
        
        const result = await db.run(
            "INSERT INTO health_records (petId, pet_id, type, name, notes, date, vet_clinic, file_path, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [petId, petId, type, name, notes, date, vet_clinic, file_path, file_name]
        );
        res.json({ success: true, recordId: result.lastID });
    } catch (err) {
        console.error('Error adding health record:', err);
        // Delete uploaded file if database insert failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Error adding record: " + err.message });
    }
});

// Delete a health record
router.delete('/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        
        // Get file path before deleting
        const [records] = await db.query("SELECT file_path FROM health_records WHERE record_id = ?", [recordId]);
        
        await db.run("DELETE FROM health_records WHERE record_id = ?", [recordId]);
        
        // Delete file if it exists
        if (records && records.length > 0 && records[0].file_path) {
            // Remove leading slash and join with uploads directory
            const relativePath = records[0].file_path.replace(/^\/uploads\//, '');
            const filePath = path.join(__dirname, '..', 'uploads', relativePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting record" });
    }
});

module.exports = router;
