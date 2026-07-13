// Generates synthetic test documents for AI extraction testing:
//   /tmp/test-invoice.png  — Love's-style invoice with EXTENSION columns & bottom fees
//   /tmp/test-application.pdf — minimal driver application PDF
import sharp from "sharp";
import fs from "node:fs";

const invoiceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" font-family="Courier, monospace">
<rect width="900" height="1100" fill="white"/>
<text x="60" y="60" font-size="26" font-weight="bold">LOVE'S TRUCK CARE #325</text>
<text x="60" y="90" font-size="15">1420 Interstate Dr, Amarillo, TX 79111 · (806) 555-0142</text>
<text x="60" y="140" font-size="15">Invoice #: LTC-88214        Service Order: SO-4471</text>
<text x="60" y="165" font-size="15">Date: 07/08/2026            Customer: Test Trucking</text>
<text x="60" y="190" font-size="15">Unit #: 101                 VIN: 1FUJGLDR2LLL55555</text>
<text x="60" y="215" font-size="15">Odometer: 431,250</text>
<text x="60" y="270" font-size="14" font-weight="bold">DESCRIPTION                        QTY   LIST    PRODUCT  LABOR   EXTENSION</text>
<line x1="60" y1="280" x2="840" y2="280" stroke="black"/>
<text x="60" y="310" font-size="14">PM SERVICE - OIL &amp; FILTER CHANGE   1     0.00    0.00     189.99  189.99</text>
<text x="60" y="340" font-size="14">DELO 15W40 ENGINE OIL (GAL)        11    24.99   24.99    0.00    274.89</text>
<text x="60" y="370" font-size="14">OIL FILTER LUBERFINER              1     32.50   32.50    0.00    32.50</text>
<text x="60" y="400" font-size="14">FUEL FILTER KIT                    2     41.25   41.25    0.00    82.50</text>
<text x="60" y="430" font-size="14">DOT ANNUAL INSPECTION              1     0.00    0.00     125.00  125.00</text>
<text x="60" y="460" font-size="14">Dismount &amp; Mount Truck Tire        3     52.99   0.00     52.99   158.97</text>
<line x1="60" y1="490" x2="840" y2="490" stroke="black"/>
<text x="500" y="530" font-size="15">Subtotal:            863.85</text>
<text x="500" y="560" font-size="15">Shop Supplies:        43.19</text>
<text x="500" y="590" font-size="15">Disposal Fee:         15.00</text>
<text x="500" y="620" font-size="15">Sales Tax:            76.07</text>
<text x="500" y="655" font-size="17" font-weight="bold">TOTAL:               998.11</text>
<text x="500" y="700" font-size="15">Amount Paid:         998.11</text>
<text x="500" y="730" font-size="15">Balance Due:           0.00</text>
<text x="230" y="880" font-size="80" fill="rgba(200,30,30,0.35)" transform="rotate(-20 400 850)" font-weight="bold">PAID</text>
</svg>`;

await sharp(Buffer.from(invoiceSvg)).png().toFile("/tmp/test-invoice.png");
console.log("wrote /tmp/test-invoice.png");

// ── Minimal one-page PDF with application text ──────────────────────────────
const lines = [
  "DRIVER EMPLOYMENT APPLICATION (Tenstreet)",
  "",
  "Full Legal Name: Carlos M Delgado",
  "Date of Birth: 03/22/1988",
  "Address: 88 Ranch Rd, Fort Worth, TX 76101",
  "Cell Phone: (817) 555-0177",
  "Email: carlos.delgado@example.com",
  "",
  "CDL Number: TX0448821",
  "CDL State: TX",
  "CDL Expiration: 09/30/2028",
  "Medical Card Expiration: 05/14/2027",
  "Years of Commercial Driving Experience: 9",
  "Endorsements: H, N",
  "Position Applied For: Regional Driver",
  "",
  "EMPLOYMENT HISTORY",
  "Employer 1: Lone Star Freight, Dallas, TX (214) 555-0100",
  "  Position: OTR Driver   From: 06/2019  To: 05/2026",
  "Employer 2: Big Sky Logistics, Amarillo, TX (806) 555-0155",
  "  Position: Regional Driver   From: 02/2017  To: 05/2019",
];

const textOps = lines
  .map((line, i) => `BT /F1 12 Tf 60 ${760 - i * 22} Td (${line.replace(/[()\\]/g, "\\$&")}) Tj ET`)
  .join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  null, // content stream, built below
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

const stream = textOps;
objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;

let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((obj, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

fs.writeFileSync("/tmp/test-application.pdf", pdf, "binary");
console.log("wrote /tmp/test-application.pdf");
