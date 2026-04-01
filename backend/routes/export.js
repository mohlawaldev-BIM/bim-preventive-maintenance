const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const PDFDocument = require('pdfkit');

router.get('/workorders/pdf', async (req, res) => {
  try {
    const { projectId, categories } = req.query
    let conditions = [`wo.project_id = $1`, `wo.status = 'pending'`]
    let values = [projectId]

    if (categories) {
      const list = categories.split(',').filter(Boolean)
      if (list.length > 0) {
        conditions.push(`a.category = ANY($2::text[])`)
        values.push(list)
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const { rows } = await pool.query(
      `SELECT wo.*, a.name as asset_name, a.category, a.location
       FROM work_orders wo JOIN assets a ON wo.asset_id = a.id
       ${where}
       ORDER BY CASE wo.priority WHEN 'high' THEN 1 ELSE 2 END`,
      values
    )

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=work-orders.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('BIM Maintenance System', { align: 'center' });
    doc.fontSize(12).text('Pending Work Orders Report', { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    if (categories) {
      doc.text(`Categories: ${categories.split(',').join(', ')}`, { align: 'center' });
    }
    doc.moveDown(2);

    const high = rows.filter(r => r.priority === 'high').length;
    const medium = rows.filter(r => r.priority === 'medium').length;
    doc.fontSize(13).text('Summary', { underline: true });
    doc.fontSize(11).text(`Total pending work orders: ${rows.length}`);
    doc.text(`High priority (overdue): ${high}`);
    doc.text(`Medium priority (due soon): ${medium}`);
    doc.moveDown(2);

    doc.fontSize(13).text('Work Orders', { underline: true });
    doc.moveDown(0.5);

    rows.forEach((wo, index) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).text(`${index + 1}. [${wo.priority.toUpperCase()}] ${wo.title}`);
      doc.fontSize(10)
        .text(`   Asset: ${wo.asset_name}`)
        .text(`   Category: ${wo.category}`)
        .text(`   Location: ${wo.location || 'Unknown'}`)
        .text(`   Due: ${wo.due_date ? new Date(wo.due_date).toLocaleDateString() : 'N/A'}`)
        .moveDown(0.8);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;