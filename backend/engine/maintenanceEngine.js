const pool = require('../config/db');

async function calculateStatus(lastMaintenanceDate, intervalDays) {
  const last = new Date(lastMaintenanceDate);
  const today = new Date();
  const nextDue = new Date(last);
  nextDue.setDate(nextDue.getDate() + intervalDays);
  const daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return { status: 'overdue', daysUntilDue, nextDue };
  if (daysUntilDue <= 14) return { status: 'due_soon', daysUntilDue, nextDue };
  return { status: 'healthy', daysUntilDue, nextDue };
}

async function runMaintenanceCheck(projectId, categories = []) {
  console.log(`\n[${new Date().toISOString()}] Running maintenance check for project ${projectId}...`);

  try {
    let conditions = [`project_id = $1`, `last_maintenance_date IS NOT NULL`];
    let values = [projectId];

    if (categories.length > 0) {
      conditions.push(`category = ANY($2::text[])`);
      values.push(categories);
    }

    const { rows: assets } = await pool.query(
      `SELECT id, name, category, last_maintenance_date, maintenance_interval
       FROM assets WHERE ${conditions.join(' AND ')}`,
      values
    );

    let overdue = 0, dueSoon = 0, healthy = 0;

    for (const asset of assets) {
      const { status, daysUntilDue, nextDue } = await calculateStatus(
        asset.last_maintenance_date, asset.maintenance_interval
      );
      await pool.query(
        `UPDATE assets SET status=$1, next_maintenance_date=$2, days_until_due=$3 WHERE id=$4`,
        [status, nextDue, daysUntilDue, asset.id]
      );
      if (status === 'overdue') overdue++;
      else if (status === 'due_soon') dueSoon++;
      else healthy++;
    }

    console.log(`Check complete — Healthy: ${healthy} | Due soon: ${dueSoon} | Overdue: ${overdue}`);
    return { healthy, dueSoon, overdue, total: assets.length };
  } catch (err) {
    console.error('Maintenance check failed:', err.message);
  }
}

module.exports = { runMaintenanceCheck };