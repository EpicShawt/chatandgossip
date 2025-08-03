const User = require('../models/User');

// Generate a random 6-character ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a unique ID that doesn't exist in the database
async function generateUniqueId() {
  let uniqueId;
  let isUnique = false;
  
  while (!isUnique) {
    uniqueId = generateId();
    const existingUser = await User.findOne({ uniqueId });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return uniqueId;
}

module.exports = { generateUniqueId }; 