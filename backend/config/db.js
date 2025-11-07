const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, '..', 'pet_care.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create tables if they don't exist
    createTables();
  }
});

function createTables() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create pets table
  db.run(`
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      species TEXT,
      breed TEXT,
      age INTEGER,
      birth_date DATE,
      gender TEXT,
      weight TEXT,
      color TEXT,
      emoji TEXT,
      group_code TEXT,
      pet_code TEXT UNIQUE,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id)
    )
  `);
  
  // Add new columns to existing pets table if they don't exist
  db.run(`ALTER TABLE pets ADD COLUMN birth_date DATE`, (err) => { 
    if (err && !err.message.includes('duplicate column')) console.error('Error adding birth_date:', err); 
  });
  db.run(`ALTER TABLE pets ADD COLUMN gender TEXT`, (err) => { 
    if (err && !err.message.includes('duplicate column')) console.error('Error adding gender:', err); 
  });
  db.run(`ALTER TABLE pets ADD COLUMN weight TEXT`, (err) => { 
    if (err && !err.message.includes('duplicate column')) console.error('Error adding weight:', err); 
  });
  db.run(`ALTER TABLE pets ADD COLUMN color TEXT`, (err) => { 
    if (err && !err.message.includes('duplicate column')) console.error('Error adding color:', err); 
  });
  
  // Add pet_code column - SQLite doesn't support UNIQUE in ALTER TABLE, so add without constraint first
  db.run(`ALTER TABLE pets ADD COLUMN pet_code TEXT`, (err) => { 
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding pet_code column:', err);
    } else {
      console.log('pet_code column added/verified successfully');
      // Create unique index after adding column (if not exists)
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pets_pet_code ON pets(pet_code)`, (indexErr) => {
        if (indexErr && !indexErr.message.includes('already exists')) {
          console.error('Error creating unique index on pet_code:', indexErr);
        } else {
          console.log('Unique index on pet_code created/verified');
        }
      });
      // Generate pet codes for existing pets that don't have one
      setTimeout(() => {
        generatePetCodesForExistingPets();
      }, 500);
    }
  });

  // Create todos table
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      title TEXT NOT NULL,
      task TEXT,
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      petId INTEGER,
      pet_id INTEGER,
      user_id INTEGER,
      assigned_to TEXT,
      reminder_time DATETIME,
      repeat_type TEXT DEFAULT 'none',
      repeat_interval INTEGER DEFAULT 1,
      repeat_days TEXT,
      is_recurring BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create appointments table
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      details TEXT,
      datetime DATETIME,
      completed BOOLEAN DEFAULT 0,
      petId INTEGER,
      pet_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create health_records table
  db.run(`
    CREATE TABLE IF NOT EXISTS health_records (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      petId INTEGER,
      pet_id INTEGER,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      date DATETIME,
      vet_clinic TEXT,
      file_path TEXT,
      file_name TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create vaccine_schedule table
  db.run(`
    CREATE TABLE IF NOT EXISTS vaccine_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petId INTEGER,
      pet_id INTEGER,
      vaccine_name TEXT NOT NULL,
      age_years INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      completed_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets (id)
    )
  `);

  // Create groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER,
      group_code TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id)
    )
  `);

  // Create group_members table
  db.run(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      user_id INTEGER,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('Database tables created successfully');
}

// Helper function to generate unique code for a single pet
function generateUniqueCodeForPet(petId, callback) {
  let attempts = 0;
  const maxAttempts = 10;
  
  function tryGenerateCode() {
    if (attempts >= maxAttempts) {
      console.error(`❌ Failed to generate unique pet code for pet ${petId} after ${maxAttempts} attempts`);
      if (callback) callback();
      return;
    }
    
    const petCode = Math.random().toString(36).substring(2, 9).toUpperCase();
    
    // Check if code exists
    db.get('SELECT id FROM pets WHERE pet_code = ?', [petCode], (checkErr, existing) => {
      if (checkErr) {
        console.error(`Error checking pet code uniqueness:`, checkErr);
        attempts++;
        setTimeout(tryGenerateCode, 100); // Small delay before retry
        return;
      }
      
      if (existing) {
        // Code exists, try again
        attempts++;
        tryGenerateCode();
      } else {
        // Code is unique, update pet
        db.run('UPDATE pets SET pet_code = ? WHERE id = ?', [petCode, petId], (updateErr) => {
          if (updateErr) {
            console.error(`Error updating pet ${petId} with code:`, updateErr);
            attempts++;
            setTimeout(tryGenerateCode, 100);
          } else {
            console.log(`✅ Generated pet code ${petCode} for pet ${petId}`);
            if (callback) callback();
          }
        });
      }
    });
  }
  
  tryGenerateCode();
}

// Function to generate pet codes for existing pets that don't have one
function generatePetCodesForExistingPets() {
  // First check if pet_code column exists
  db.all("PRAGMA table_info(pets)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }
    
    const hasPetCodeColumn = columns.some(col => col.name === 'pet_code');
    if (!hasPetCodeColumn) {
      console.error('pet_code column does not exist in pets table!');
      console.log('Attempting to add pet_code column...');
      db.run(`ALTER TABLE pets ADD COLUMN pet_code TEXT UNIQUE`, (alterErr) => {
        if (alterErr) {
          console.error('Failed to add pet_code column:', alterErr);
        } else {
          console.log('pet_code column added successfully');
          // Retry generating codes
          setTimeout(() => generatePetCodesForExistingPets(), 500);
        }
      });
      return;
    }
    
    // Column exists, proceed with generating codes
    db.all('SELECT id FROM pets WHERE pet_code IS NULL OR pet_code = ""', [], (err, pets) => {
      if (err) {
        console.error('Error fetching pets without codes:', err);
        return;
      }
      
      if (pets && pets.length > 0) {
        console.log(`Generating pet codes for ${pets.length} existing pets...`);
        // Process pets sequentially to avoid memory issues
        let index = 0;
        
        function processNextPet() {
          if (index >= pets.length) {
            console.log('✅ Finished generating pet codes for all pets');
            return;
          }
          
          const pet = pets[index];
          generateUniqueCodeForPet(pet.id, () => {
            index++;
            processNextPet();
          });
        }
        
        processNextPet();
      } else {
        console.log('All pets already have codes or no pets exist');
      }
    });
  });
}

// Export a promise-based interface for easier use
module.exports = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve([rows]);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};