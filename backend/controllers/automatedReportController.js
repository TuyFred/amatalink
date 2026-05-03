import pool from '../config/database.js';
import PDFDocument from 'pdfkit';
import { buildPDFReport } from './reportController.js';
import { sendMonthlyReportEmail } from './emailUtils.js';

/**
 * Generates and sends monthly milk collection reports to all farmers.
 * Should be run on the 1st of every month.
 */
export const generateAndSendMonthlyReports = async () => {
    try {
        console.log('--- Starting Monthly Report Generation ---');
        
        const now = new Date();
        const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const startDate = firstDayPrevMonth.toISOString().split('T')[0];
        const endDate = lastDayPrevMonth.toISOString().split('T')[0];
        const monthName = firstDayPrevMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log(`Generating reports for period: ${startDate} to ${endDate} (${monthName})`);

        // Get all farmers with valid emails
        const [farmers] = await pool.execute(`
            SELECT f.id as farmer_db_id, u.id as user_id, u.full_name, u.email
            FROM farmers f
            JOIN users u ON f.user_id = u.id
            WHERE u.email IS NOT NULL AND u.email != ''
        `);

        console.log(`Found ${farmers.length} farmers with emails.`);

        for (const farmer of farmers) {
            try {
                // Fetch records for this farmer in the date range
                const [records] = await pool.execute(`
                    SELECT mr.*, u.full_name as collector_name, 
                           fu.full_name as farmer_name, fu.phone as farmer_phone
                    FROM milk_records mr
                    JOIN collectors c ON mr.collector_id = c.id
                    JOIN users u ON c.user_id = u.id
                    JOIN farmers f ON mr.farmer_id = f.id
                    JOIN users fu ON f.user_id = fu.id
                    WHERE f.id = ? AND mr.collection_date >= ? AND mr.collection_date <= ?
                    ORDER BY mr.collection_date ASC
                `, [farmer.farmer_db_id, startDate, endDate]);

                if (records.length === 0) {
                    console.log(`Skipping ${farmer.full_name}: No records found for ${monthName}.`);
                    continue;
                }

                console.log(`Generating report for ${farmer.full_name} (${records.length} records)...`);

                // Create PDF
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];
                
                doc.on('data', chunk => chunks.push(chunk));
                
                // Wait for the PDF to be fully generated
                const pdfBuffer = await new Promise((resolve) => {
                    doc.on('end', () => resolve(Buffer.concat(chunks)));
                    buildPDFReport(records, startDate, endDate, doc);
                });

                const fileName = `AmataLink_Report_${farmer.full_name.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`;

                // Send Email
                await sendMonthlyReportEmail(farmer.email, farmer.full_name, monthName, pdfBuffer, fileName);
                
                console.log(`✅ Monthly report sent to ${farmer.full_name} (${farmer.email})`);
            } catch (farmerError) {
                console.error(`❌ Failed to generate report for ${farmer.full_name}:`, farmerError);
            }
        }

        console.log('--- Monthly Report Generation Completed ---');
    } catch (error) {
        console.error('Critical Error in generateAndSendMonthlyReports:', error);
    }
};

export default { generateAndSendMonthlyReports };
