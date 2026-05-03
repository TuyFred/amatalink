import pool from '../config/database.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const buildPDFReport = (records, startDate, endDate, doc, isBuffer = false) => {
    // Header
    doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text('AmataLink Dairy Network', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Efficient Milk Productivity Management', { align: 'center' });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown();

    // Report Title & Meta
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Milk Collection Report', { underline: true });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b');
    doc.text(`Generated on: ${new Date().toLocaleString()}`);
    doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`);
    doc.moveDown();

    // Table Header
    const tableTop = doc.y;
    const itemHeight = 25;

    const drawRow = (y, data, isHeader = false) => {
        if (isHeader) {
            doc.rect(50, y, 500, itemHeight).fill('#f1f5f9');
            doc.fillColor('#475569').font('Helvetica-Bold');
        } else {
            doc.fillColor('#1e293b').font('Helvetica');
        }

        const cols = [
            { label: 'Date', x: 60, w: 80 },
            { label: 'Farmer', x: 140, w: 150 },
            { label: 'Liters', x: 300, w: 60 },
            { label: 'Amount (RWF)', x: 370, w: 90 },
            { label: 'Status', x: 470, w: 70 }
        ];

        cols.forEach(col => {
            doc.text(isHeader ? col.label : data[col.label.toLowerCase().replace(/ /g, '_')] || '', col.x, y + 7, { width: col.w, truncate: true });
        });

        doc.moveTo(50, y + itemHeight).lineTo(550, y + itemHeight).strokeColor('#f1f5f9').stroke();
    };

    drawRow(tableTop, {}, true);

    let currentY = tableTop + itemHeight;
    let totalLiters = 0;
    let totalAmount = 0;

    records.forEach((rec, index) => {
        if (currentY + itemHeight > 700) {
            doc.addPage();
            currentY = 50;
            drawRow(currentY, {}, true);
            currentY += itemHeight;
        }

        const rowData = {
            date: new Date(rec.collection_date).toLocaleDateString(),
            farmer: rec.farmer_name,
            liters: `${rec.liters} L`,
            amount_rwf: `${rec.total_amount.toLocaleString()} RWF`,
            status: (rec.status || 'confirmed').toUpperCase()
        };

        drawRow(currentY, rowData);
        currentY += itemHeight;

        totalLiters += Number(rec.liters);
        totalAmount += Number(rec.total_amount);
    });

    // Summary
    doc.moveDown();
    if (currentY + 100 > 750) doc.addPage();

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Summary Total', 370);
    doc.fontSize(10).font('Helvetica').text(`Total Liters: ${totalLiters.toFixed(2)} L`, 370);
    doc.text(`Total Amount: ${totalAmount.toLocaleString()} RWF`, 370);

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94a3b8').text(
            `Page ${i + 1} of ${pages.count} - AmataLink Dairy Network - Log of AmataLink`,
            50,
            750,
            { align: 'center', width: 500 }
        );
    }

    doc.end();
};

// Export PDF Report
export const exportPDF = async (req, res) => {
    try {
        const { startDate, endDate, farmerId } = req.query;

        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { role, id: userId } = req.user;

        let query = `
      SELECT mr.*, u.full_name as collector_name, 
             fu.full_name as farmer_name, fu.phone as farmer_phone
      FROM milk_records mr
      JOIN collectors c ON mr.collector_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE 1=1
    `;
        const params = [];

        // Role-based filtering
        if (role === 'farmer') {
            query += ' AND f.user_id = ?';
            params.push(userId);
        } else if (role === 'collector') {
            if (farmerId) {
                query += ' AND f.user_id = ?';
                params.push(farmerId);
            }
        } else if (role === 'admin' && farmerId) {
            query += ' AND f.user_id = ?';
            params.push(farmerId);
        }

        if (startDate) {
            query += ' AND mr.collection_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND mr.collection_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY mr.collection_date DESC, mr.collection_time DESC';

        const [records] = await pool.execute(query, params);

        const doc = new PDFDocument({ margin: 50 });
        let filename = `AmataLink_Report_${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);
        buildPDFReport(records, startDate, endDate, doc);
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
};

// Export Excel Report
export const exportExcel = async (req, res) => {
    try {
        const { startDate, endDate, farmerId } = req.query;

        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { role, id: userId } = req.user;

        let query = `
      SELECT mr.*, u.full_name as collector_name, 
             fu.full_name as farmer_name, fu.phone as farmer_phone, fu.village, fu.sector
      FROM milk_records mr
      JOIN collectors c ON mr.collector_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE 1=1
    `;
        const params = [];

        if (role === 'farmer') {
            query += ' AND f.user_id = ?';
            params.push(userId);
        } else if (farmerId) {
            query += ' AND f.user_id = ?';
            params.push(farmerId);
        }

        if (startDate) {
            query += ' AND mr.collection_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND mr.collection_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY mr.collection_date DESC';

        const [records] = await pool.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AmataLink';
        workbook.lastModifiedBy = 'AmataLink System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('AmataLink Daily Logs');

        // Title & Branding
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'AmataLink Dairy Network - Milk Collection Logs';
        titleCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FF1E293B' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.mergeCells('A2:H2');
        const periodCell = sheet.getCell('A2');
        periodCell.value = `Report Period: ${startDate || 'Start'} to ${endDate || 'End'}`;
        periodCell.font = { italic: true, size: 11 };
        periodCell.alignment = { horizontal: 'center' };

        // Headers
        const headerRow = sheet.getRow(4);
        headerRow.values = ['ID', 'Date', 'Farmer Name', 'Phone', 'Liters (L)', 'Rate (RWF)', 'Total (RWF)', 'Collector'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
            cell.alignment = { horizontal: 'center' };
        });

        // Content
        records.forEach((rec, idx) => {
            sheet.addRow([
                rec.id,
                new Date(rec.collection_date).toLocaleDateString(),
                rec.farmer_name,
                rec.farmer_phone,
                Number(rec.liters),
                Number(rec.rate_per_liter),
                Number(rec.total_amount),
                rec.collector_name
            ]);
        });

        // Formatting
        sheet.getColumn(3).width = 25;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(7).numFmt = '#,##0 "RWF"';
        sheet.getColumn(8).width = 20;

        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary Overview');
        summarySheet.addRow(['AmataLink Summary Report']);
        summarySheet.addRow([]);
        summarySheet.addRow(['Metric', 'Value']);

        const totalLiters = records.reduce((sum, r) => sum + Number(r.liters), 0);
        const totalAmount = records.reduce((sum, r) => sum + Number(r.total_amount), 0);

        summarySheet.addRow(['Total records', records.length]);
        summarySheet.addRow(['Total Liters Collected', `${totalLiters.toFixed(2)} L`]);
        summarySheet.addRow(['Total Earnings/Payouts', `${totalAmount.toLocaleString()} RWF`]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="AmataLink_Records_${Date.now()}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ message: 'Error generating Excel report' });
    }
};
