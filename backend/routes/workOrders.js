const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/generate', async (req, res) => {
  try {
    const { projectId, categories } = req.query;
    let conditions = `project_id = $1 AND status IN ('overdue','due_soon')
      AND id NOT IN (SELECT asset_id FROM work_orders WHERE status='pending')`;
    let values = [projectId];

    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions += ` AND category = ANY($2::text[])`;
        values.push(list);
      }
    }

    const { rows: assets } = await pool.query(`SELECT * FROM assets WHERE ${conditions}`, values);
    if (assets.length === 0) return res.json({ message: 'No new work orders needed', generated: 0 });

    let generated = 0;
    for (const asset of assets) {
      const priority = asset.status === 'overdue' ? 'high' : 'medium';
      const title = `${asset.status === 'overdue' ? 'OVERDUE' : 'Upcoming'} maintenance — ${asset.name}`;
      const description = `Asset: ${asset.name}\nCategory: ${asset.category}\nLocation: ${asset.location}\nStatus: ${asset.status}\nDays until due: ${asset.days_until_due}\nNext maintenance: ${asset.next_maintenance_date}\nInterval: every ${asset.maintenance_interval} days`;
      await pool.query(
        `INSERT INTO work_orders (project_id, asset_id, title, description, priority, status, due_date)
         VALUES ($1,$2,$3,$4,$5,'pending',$6)`,
        [projectId, asset.id, title, description, priority, asset.next_maintenance_date]
      );
      generated++;
    }
    res.json({ message: 'Work orders generated', generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { projectId, categories } = req.query;
    let joinClause = 'JOIN assets a ON wo.asset_id = a.id';
    let conditions = [`wo.project_id = $1`];
    let values = [projectId];

    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions.push(`a.category = ANY($2::text[])`);
        values.push(list);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE wo.status='pending') as pending,
        COUNT(*) FILTER (WHERE wo.status='completed') as completed,
        COUNT(*) FILTER (WHERE wo.priority='high' AND wo.status='pending') as high_priority,
        COUNT(*) FILTER (WHERE wo.priority='medium' AND wo.status='pending') as medium_priority
       FROM work_orders wo ${joinClause} ${where}`, values
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const { projectId, categories } = req.query;
    let conditions = [`wo.project_id = $1`];
    let values = [projectId];

    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions.push(`a.category = ANY($2::text[])`);
        values.push(list);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query(
      `SELECT wo.*, a.name as asset_name, a.category, a.location
       FROM work_orders wo JOIN assets a ON wo.asset_id = a.id
       ${where} ORDER BY wo.created_at DESC`, values
    );
    res.json({ workOrders: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { projectId, page = 1, limit = 20, priority, status = 'pending', categories } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [`wo.project_id = $1`, `wo.status = $2`];
    let values = [projectId, status];
    let paramIndex = 3;

    if (priority) { conditions.push(`wo.priority = $${paramIndex++}`); values.push(priority); }
    if (categories) {
      const list = categories.split(',').filter(Boolean);
      if (list.length > 0) {
        conditions.push(`a.category = ANY($${paramIndex++}::text[])`);
        values.push(list);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM work_orders wo JOIN assets a ON wo.asset_id = a.id ${where}`, values
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT wo.*, a.name as asset_name, a.category, a.location, a.status as asset_status
       FROM work_orders wo JOIN assets a ON wo.asset_id = a.id
       ${where}
       ORDER BY CASE wo.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, wo.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    res.json({
      workOrders: rows,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: parseInt(page) < Math.ceil(total / limit),
        hasPrev: parseInt(page) > 1,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    await pool.query(
      `UPDATE work_orders SET status='completed', completed_at=NOW() WHERE id=$1`, [req.params.id]
    );
    const { rows } = await pool.query(`SELECT asset_id FROM work_orders WHERE id=$1`, [req.params.id]);
    if (rows.length > 0) {
      await pool.query(
        `UPDATE assets SET last_maintenance_date=CURRENT_DATE, status='healthy' WHERE id=$1`,
        [rows[0].asset_id]
      );
    }
    res.json({ message: 'Work order completed and asset updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;