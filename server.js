const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(bodyParser.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes("youtube.com")) {
    return res.status(400).json({ error: "URL inválida" });
  }

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scroll automático
    await autoScroll(page);

    const videos = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a#video-title-link");
      return Array.from(anchors).map((a) => ({
        title: a.title,
        href: a.href,
      }));
    });

    await browser.close();
    res.json({ videos });
  } catch (err) {
    console.error("Error durante el scraping:", err);
    res.status(500).json({ error: "Error durante el scraping" });
  }
});

// Función para hacer scroll
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 1000;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  });
}

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
