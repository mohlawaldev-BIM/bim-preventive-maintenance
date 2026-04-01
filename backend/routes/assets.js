const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { runMaintenanceCheck } = require('../engine/maintenanceEngine');

// Bulk import
router.post('/bulk', async (req, res) => {
  const { assets, projectId } = req.body;
  if (!assets || assets.length === 0) return res.status(400).json({ error: 'No assets provided' });
  if (!projectId) return res.status(400).json({ error: 'No projectId provided' });

  let inserted = 0, skipped = 0;
  for (const asset of assets) {
    try {
      const result = await pool.query(
        `INSERT INTO assets 
          (project_id, guid, name, category, location, manufacturer,
           installation_date, maintenance_interval, last_maintenance_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (project_id, guid) DO NOTHING RETURNING id`,
        [projectId, asset.guid, asset.name, asset.category, asset.location,
         asset.manufacturer, asset.installation_date, asset.maintenance_interval,
         asset.last_maintenance_date]
      );
      result.rows.length > 0 ? inserted++ : skipped++;
    } catch (err) {
      skipped++;
    }
  }
  res.json({ message: 'Import complete', inserted, skipped });
});

// Get categories
router.get('/categories', async (req, res) => {
  const { projectId } = req.query;
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM assets WHERE project_id = $1 ORDER BY category ASC`,
      [projectId]
    );
    res.json(result.rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stats
router.get('/stats', async (req, res) => {
  const { projectId, categories } = req.query;
  try {
    let conditions = [`project_id = $1`];
    let values = [projectId];
    let paramIndex = 2;

    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions.push(`category = ANY($${paramIndex++}::text[])`);
        values.push(list);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE status = 'due_soon') as due_soon,
        COUNT(*) FILTER (WHERE status = 'healthy') as healthy
       FROM assets ${where}`, values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run maintenance check
router.get('/maintenance/run', async (req, res) => {
  const { projectId, categories } = req.query;
  const categoryList = categories ? categories.split(',').filter(Boolean) : [];
  const result = await runMaintenanceCheck(parseInt(projectId), categoryList);
  res.json(result);
});

// Get paginated assets
router.get('/', async (req, res) => {
  const { projectId, page = 1, limit = 20, status, category, categories } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [`project_id = $1`];
    let values = [projectId];
    let paramIndex = 2;

    if (status) { conditions.push(`status = $${paramIndex++}`); values.push(status); }
    if (category) { conditions.push(`category = $${paramIndex++}`); values.push(category); }
    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions.push(`category = ANY($${paramIndex++}::text[])`);
        values.push(list);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await pool.query(`SELECT COUNT(*) FROM assets ${where}`, values);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM assets ${where}
       ORDER BY CASE status WHEN 'overdue' THEN 1 WHEN 'due_soon' THEN 2 ELSE 3 END, id ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    res.json({
      assets: result.rows,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;