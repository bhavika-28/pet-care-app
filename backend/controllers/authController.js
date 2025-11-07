const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // adjust path as needed

const SECRET_KEY = 'secret123'; // Store securely

exports.signup = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user with this email already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists. Please log in instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [
      username,
      email,
      hashedPassword,
      role || 'user',
    ]);

    console.log(`✅ New user created: ${email} (ID: ${result.lastID})`);
    res.status(201).json({ 
      success: true,
      message: 'User created successfully. You can now log in.',
      userId: result.lastID
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Check for unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ message: 'User with this email already exists. Please log in instead.' });
    }
    
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    //Creating a token
    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'userId, currentPassword, and newPassword are required' });
  }

  try {
    // Get user from database
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ message: 'Invalid userId format' });
  }

  try {
    const [users] = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [userIdInt]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

exports.updateUsername = async (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ message: 'userId and username are required' });
  }

  // Convert userId to integer if it's a string
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ message: 'Invalid userId format' });
  }

  try {
    // Check if user exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userIdInt]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.run('UPDATE users SET username = ? WHERE id = ?', [username, userIdInt]);
    
    // Fetch updated user data to return
    const [updatedUsers] = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [userIdInt]);
    
    res.json({ 
      success: true,
      message: 'Username updated successfully', 
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Update username error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};
