import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [emailTrimmed]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (name, email, password, role, phone, status)
       VALUES ($1, $2, $3, 'customer', $4, 'active')
       RETURNING id, name, email, role, phone, status, created_at`,
      [name.trim(), emailTrimmed, hashedPassword, phone || null]
    );

    const user = result.rows[0];

    // Create empty cart and wishlist for user
    await query(`INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]);
    await query(`INSERT INTO wishlists (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]);

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const result = await query(
      `SELECT id, name, email, password, role, phone, avatar, status
       FROM users WHERE email = $1`,
      [emailTrimmed]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // If admin, update last_login
    if (user.role === 'admin') {
      await query(`UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.id]);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    delete user.password;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const result = await query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.phone, u.avatar, u.status,
              a.department, a.permissions
       FROM users u
       JOIN admins a ON a.user_id = u.id
       WHERE u.email = $1 AND u.role = 'admin'`,
      [emailTrimmed]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    const admin = result.rows[0];

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is inactive.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    await query(`UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [admin.id]);

    const token = generateToken({ id: admin.id, email: admin.email, role: admin.role });

    delete admin.password;

    res.json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar, u.status, u.created_at,
              a.department, a.permissions
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const addressesRes = await query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC`,
      [req.user.id]
    );

    res.json({
      success: true,
      user: {
        ...userRes.rows[0],
        addresses: addressesRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar = COALESCE($3, avatar),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, role, phone, avatar, status`,
      [name, phone, avatar, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const userRes = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const userRes = await query('SELECT id, email FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset token has been generated.',
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiry, user.id]
    );

    res.json({
      success: true,
      message: 'Password reset link generated.',
      resetToken, // Returned directly for immediate ease of testing/resetting in UI
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const userRes = await query(
      `SELECT id FROM users
       WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query(
      `UPDATE users
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, userRes.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { address_type, full_name, phone, street_address, city, state, postal_code, country, is_default } = req.body;

    if (!full_name || !phone || !street_address || !city || !state || !postal_code) {
      return res.status(400).json({ success: false, message: 'All address fields are required.' });
    }

    if (is_default) {
      await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.id]);
    }

    const result = await query(
      `INSERT INTO addresses (user_id, address_type, full_name, phone, street_address, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, address_type || 'shipping', full_name, phone, street_address, city, state, postal_code, country || 'United States', !!is_default]
    );

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [id, req.user.id]);
    res.json({ success: true, message: 'Address removed.' });
  } catch (error) {
    next(error);
  }
};
