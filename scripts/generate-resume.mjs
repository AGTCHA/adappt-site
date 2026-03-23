import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "generate-resume.html");
const outputPath = path.join(__dirname, "..", "public", "assets", "resume", "Osler_Hutson_CV_2025.pdf");

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outputPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  console.log(`PDF generated: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
