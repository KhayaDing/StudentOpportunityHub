import PDFDocument from 'pdfkit';
import { Certificate } from '@shared/schema';
import { Readable } from 'stream';

// Function to format date in a readable way
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-ZA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });
}

// Generate certificate PDF
export async function generateCertificatePDF(certificate: Certificate): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Uint8Array[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
        info: {
          Title: `Certificate of Completion - ${certificate.studentName}`,
          Author: 'KimConnect Platform',
          Subject: 'Certificate of Completion',
        }
      });
      
      // Collect data chunks
      doc.on('data', chunks.push.bind(chunks));
      
      // Resolve with the complete PDF data when finished
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      
      // Certificate border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(3)
         .stroke('#3b82f6');
      
      // Inner decorative border
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
         .lineWidth(1)
         .stroke('#d1d5db');

      // Header
      doc.fontSize(30)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('CERTIFICATE OF COMPLETION', {
           align: 'center',
           height: 30,
         })
         .moveDown(0.5);
      
      // KimConnect logo/name
      doc.fontSize(16)
         .fillColor('#3b82f6')
         .text('KimConnect', {
           align: 'center',
         })
         .fontSize(12)
         .fillColor('#64748b')
         .text('Connecting Students with Opportunities in Kimberley', {
           align: 'center',
         })
         .moveDown(1);
      
      // Certificate text
      doc.fontSize(14)
         .fillColor('#374151')
         .text('This is to certify that', {
           align: 'center',
         })
         .moveDown(0.5);
      
      // Student name
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#000')
         .text(certificate.studentName, {
           align: 'center',
         })
         .moveDown(0.5);
      
      // Certificate details
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#374151')
         .text('has successfully completed', {
           align: 'center',
         })
         .moveDown(0.5);
      
      // Opportunity title
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text(certificate.opportunityTitle, {
           align: 'center',
         })
         .moveDown(0.5);
      
      // Organization name
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#374151')
         .text(`at ${certificate.employerName}`, {
           align: 'center',
         })
         .moveDown(1);
      
      // Duration
      doc.fontSize(12)
         .fillColor('#64748b')
         .text(`From ${formatDate(certificate.startDate)} to ${formatDate(certificate.endDate)}`, {
           align: 'center',
         })
         .moveDown(1);
      
      // Description (if provided)
      if (certificate.description) {
        doc.fontSize(12)
           .fillColor('#374151')
           .text(certificate.description, {
             align: 'center',
             width: 400,
           })
           .moveDown(1);
      }
      
      // Issuance date
      doc.fontSize(12)
         .fillColor('#64748b')
         .text(`Issued on: ${formatDate(certificate.issuedAt)}`, {
           align: 'center',
         })
         .moveDown(2);
      
      // Signature line
      const signatureY = doc.y + 20;
      doc.moveTo(doc.page.width / 2 - 100, signatureY)
         .lineTo(doc.page.width / 2 + 100, signatureY)
         .stroke('#d1d5db');
      
      doc.fontSize(12)
         .fillColor('#374151')
         .text('Authorized Signature', {
           align: 'center',
           width: doc.page.width,
           height: 20,
         });
      
      // Certificate ID
      doc.fontSize(10)
         .fillColor('#94a3b8')
         .text(`Certificate ID: ${certificate.id}`, {
           align: 'center',
           height: 15,
         });
         
      // Verification note 
      doc.fontSize(8)
         .fillColor('#94a3b8')
         .text('This certificate can be verified at kimconnect.com/verify', {
           align: 'center',
         });
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Convert Buffer to Readable stream (for file storage or response)
export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
