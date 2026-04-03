const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const pool = require('../config/db');
const parsingState = require('../state');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../ifc-parser');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'sample.ifc');
  }
});

const fileFilter = (req, file, cb) => {
  file.originalname.toLowerCase().endsWith('.ifc')
    ? cb(null, true)
    : cb(new Error('Only .ifc files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

router.post('/', upload.single('ifcFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No IFC file uploaded' });
  }

  if (parsingState.isParsing) {
    return res.status(409).json({
      error: 'A file is already being parsed. Please wait.',
      status: 'busy'
    });
  }

  try {
    const projectName = req.file.originalname.replace('.ifc', '').replace(/_/g, ' ')
    const { rows } = await pool.query(
      `INSERT INTO projects (name, filename) VALUES ($1, $2) RETURNING *`,
      [projectName, req.file.originalname]
    );
    const project = rows[0];
    console.log(`Created project: ${project.name} (ID: ${project.id})`);

    parsingState.isParsing = true;
    parsingState.startedAt = new Date();
    parsingState.filename = req.file.originalname;
    parsingState.projectId = project.id;
    parsingState.lastCompletedProjectId = null; // reset last completed

    const parserPath = path.join(__dirname, '../../ifc-parser/parser.py');
    const venvPython = path.join(__dirname, '../../ifc-parser/venv/Scripts/python.exe');
    const pythonCmd = fs.existsSync(venvPython)
      ? `"${venvPython}"`
      : process.platform === 'win32' ? 'python' : 'python3';
    const command = `${pythonCmd} "${parserPath}" ${project.id}`;

    console.log('Starting IFC parser...');

    res.json({
      message: 'File uploaded successfully. Parsing has started.',
      filename: req.file.originalname,
      projectId: project.id,
      projectName: project.name,
      status: 'parsing'
    });

    exec(command, {
      cwd: path.join(__dirname, '../../ifc-parser'),
      maxBuffer: 1024 * 1024 * 50
    }, (error, stdout, stderr) => {
      // Save the projectId BEFORE clearing it
      const completedProjectId = parsingState.projectId;

      parsingState.isParsing = false;
      parsingState.startedAt = null;
      parsingState.projectId = null;

      if (error) {
        console.error('Parser error:', error.message);
        if (stderr) console.error('stderr:', stderr);
        //Only delete if truly empty — don't delete on partial success
        pool.query(
          `DELETE FROM projects WHERE id = $1 
           AND (SELECT COUNT(*) FROM assets WHERE project_id = $1) = 0`,
          [completedProjectId]
        );
        return;
      }

      //Store completed project ID so status endpoint can still query it
      parsingState.lastCompletedProjectId = completedProjectId;

      if (stdout) console.log('Parser output:\n', stdout);
      console.log(`Parsing complete for project ${completedProjectId}!`);
    });

  } catch (err) {
    parsingState.isParsing = false;
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    // Use active projectId while parsing, fall back to last completed after
    const projectId = parsingState.isParsing
      ? parsingState.projectId
      : parsingState.lastCompletedProjectId

    let total = 0;
    if (projectId) {
      const result = await pool.query(
        `SELECT COUNT(*) as total FROM assets WHERE project_id = $1`,
        [projectId]
      );
      total = parseInt(result.rows[0].total);
    }

    res.json({
      hasFile: fs.existsSync(path.join(__dirname, '../../ifc-parser/sample.ifc')),
      assetCount: total,
      isParsing: parsingState.isParsing,
      parsingFile: parsingState.filename,
      projectId: projectId,
      status: parsingState.isParsing ? 'parsing' : total > 0 ? 'ready' : 'empty'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;