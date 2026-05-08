const fs = require('fs');
const path = require('path');

const correctionsPath = path.join(__dirname, '..', '..', 'user_corrections.json');

// Pre-seed with smart defaults so generic terms don't map to random variants
let corrections = {
  "rice": "boiled rice",
  "chicken": "chicken stew",
  "roti": "chapati",
  "dal": "dalma",
};

try {
  if (fs.existsSync(correctionsPath)) {
    const saved = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
    corrections = { ...corrections, ...saved };
  }
} catch (err) {
  console.error("Failed to load user corrections", err);
}

const saveCorrections = () => {
  try {
    fs.writeFileSync(correctionsPath, JSON.stringify(corrections, null, 2));
  } catch (err) {}
};

const applyUserCorrections = (ingredientList) => {
  return ingredientList.map(ing => {
    const key = ing.toLowerCase().trim();
    if (corrections[key]) {
      console.log(`[Memory] Applied user correction: "${ing}" → "${corrections[key]}"`);
      return corrections[key];
    }
    return ing;
  });
};

const addUserCorrection = (wrongName, correctName) => {
  corrections[wrongName.toLowerCase().trim()] = correctName.toLowerCase().trim();
  saveCorrections();
};

module.exports = { applyUserCorrections, addUserCorrection };
