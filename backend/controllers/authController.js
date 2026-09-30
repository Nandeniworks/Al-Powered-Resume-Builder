const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 1. Create user in Firebase Authentication
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
    } catch (fbError) {
      return res.status(400).json({ message: fbError.message });
    }

    // 2. Save user in MongoDB with role "user" and firebaseUid (no password stored)
    const user = await User.create({
      name,
      email,
      firebaseUid: firebaseUser.uid,
      role: 'user', // Public registrations always default to normal user
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Authenticate with Firebase Email/Password REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await fetch(firebaseEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(401).json({
        message: data.error?.message || 'Invalid email or password',
      });
    }

    // 2. Retrieve user record from MongoDB using firebaseUid or email
    const user = await User.findOne({
      $or: [{ firebaseUid: data.localId }, { email }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // 3. Create backend JWT containing user id and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Return JWT and user details to client
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
};
