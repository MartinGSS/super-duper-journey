const fs = require("fs");
const path = require("path");

const input = fs.readFileSync("star_matcher_app.jsx", "utf8");
const blocks = input.split(/\/\* File: (.+?) \*\//g).slice(1);

for (let i = 0; i < blocks.length; i += 2) {
  const filename = blocks[i].trim();
  const content = blocks[i + 1].trimStart();

  const fullPath = path.join(__dirname, filename);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");

  console.log("✅ Created:", filename);
}
