const fs = require("fs");
const path = require("path");

// Path to your JSON file
const jsonPath = path.join(__dirname, "app", "patna_full_locations.json");

// Read JSON data
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// Base folder → app/location
const basePath = path.join(__dirname, "app", "location");

// Check if location folder exists
if (!fs.existsSync(basePath)) {
    console.error("❌ app/location folder not found. Create it manually first.");
    process.exit(1);
}
data.forEach(item => {
    let folderName = item.Location;

    // clean folderName
    folderName = folderName
        .trim()
        .replace(/\s+/g, "_")
        .replace(/\./g, "")
        .toLowerCase();

    const fullPath = path.join(basePath, folderName);

    // Create location folder
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log("📁 Created folder:", folderName);
    } else {
        console.log("📂 Already exists:", folderName);
    }

    // Create page.tsx inside the folder
    const pageFile = path.join(fullPath, "page.tsx");

    if (!fs.existsSync(pageFile)) {
        const pageContent = `
export default function Page() {
  return (
    <div>
      <h1>${item.Location}</h1>
      <p>Pincode: ${item.Pincode}</p>
      <p>District: ${item.District}</p>
      <p>State: ${item.State}</p>
    </div>
  );
}
        `;
        fs.writeFileSync(pageFile, pageContent.trim());
        console.log("📝 page.tsx created in:", folderName);
    } else {
        console.log("📝 page.tsx already exists in:", folderName);
    }
});

