const fs = require("fs");
const path = require("path");

// Your JSON file (adjust the path if needed)
const jsonPath = path.join(__dirname, "app", "patna_full_locations.json");

// Read JSON
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// Path to app/location folder
const basePath = path.join(__dirname, "app", "location");

// Make sure location folder exists
if (!fs.existsSync(basePath)) {
    console.error("❌ Folder not found: app/location");
    console.error("Please create it manually first.");
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

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log("Created:", folderName);
    } else {
        console.log("Already Exists:", folderName);
    }
});
