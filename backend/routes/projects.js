const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
        COUNT(DISTINCT a.id) as asset_count,
        COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'pending') as pending_orders
       FROM projects p
       LEFT JOIN assets a ON a.project_id = p.id
       LEFT JOIN work_orders wo ON wo.project_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;