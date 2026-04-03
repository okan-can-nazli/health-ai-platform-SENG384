import bcrypt from "bcrypt";
import crypto from "crypto";
import { query } from "../config/db.js";
import { generateAccessToken } from "../utils/token.js";
import { sendVerificationEmail } from "../utils/email.js";
import { createAuditLog } from "../services/auditService.js";

const ALLOWED_ROLES = ["engineer", "healthcare_professional"];

function isInstitutionalEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.endsWith(".edu") || normalizedEmail.endsWith(".edu.tr");
}

function calculateProfileCompleteness({ institution, expertise, city, country }) {
  let score = 40;

  if (institution) score += 20;
  if (expertise) score += 15;
  if (city) score += 15;
  if (country) score += 10;

  return score;
}

export async function register(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const {
      fullName,
      email,
      password,
      role,
      institution,
      expertise,
      city,
      country
    } = req.body;

    if (!fullName || !email || !password || !role) {
      await createAuditLog({
        actionType: "register",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: "Missing required registration fields."
      });

      return res.status(400).json({
        ok: false,
        message: "fullName, email, password, and role are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isInstitutionalEmail(normalizedEmail)) {
      await createAuditLog({
        actionType: "register",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: `Rejected non-institutional email: ${normalizedEmail}`
      });

      return res.status(400).json({
        ok: false,
        message: "Only institutional .edu or .edu.tr email addresses are allowed."
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      await createAuditLog({
        actionType: "register",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: `Invalid role: ${role}`
      });

      return res.status(400).json({
        ok: false,
        message: "Invalid role selected."
      });
    }

    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      await createAuditLog({
        actionType: "register",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: `Duplicate email: ${normalizedEmail}`
      });

      return res.status(409).json({
        ok: false,
        message: "A user with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profileCompleteness = calculateProfileCompleteness({
      institution,
      expertise,
      city,
      country
    });

    const userResult = await query(
      `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          institution,
          expertise,
          city,
          country,
          profile_completeness
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, full_name, email, role, is_email_verified, profile_completeness, created_at
      `,
      [
        fullName,
        normalizedEmail,
        passwordHash,
        role,
        institution || null,
        expertise || null,
        city || null,
        country || null,
        profileCompleteness
      ]
    );

    const user = userResult.rows[0];
    const verificationToken = crypto.randomBytes(24).toString("hex");

    await query(
      `
        INSERT INTO email_verifications (
          user_id,
          verification_token,
          expires_at
        )
        VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      `,
      [user.id, verificationToken]
    );

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        user.id,
        "account_activity",
        "Welcome to HEALTH AI",
        "Your account has been created. Please verify your email to continue."
      ]
    );

    sendVerificationEmail({
      email: user.email,
      fullName: user.full_name,
      token: verificationToken
    });

    await createAuditLog({
      userId: user.id,
      role: user.role,
      actionType: "register",
      targetEntity: "user",
      resultStatus: "success",
      ipAddress,
      details: `User registered with role ${user.role}`
    });

    return res.status(201).json({
      ok: true,
      message: "Registration successful. Please verify your email.",
      data: {
        user,
        demoVerificationToken: verificationToken
      }
    });
  } catch (error) {
    await createAuditLog({
      actionType: "register",
      targetEntity: "user",
      resultStatus: "failed",
      ipAddress,
      details: error.message
    });

    return res.status(500).json({
      ok: false,
      message: "Registration failed.",
      error: error.message
    });
  }
}

export async function verifyEmail(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "Verification token is required."
      });
    }

    const verificationResult = await query(
      `
        SELECT ev.id, ev.user_id, ev.is_used, ev.expires_at, u.role
        FROM email_verifications ev
        JOIN users u ON u.id = ev.user_id
        WHERE ev.verification_token = $1
      `,
      [token]
    );

    if (verificationResult.rows.length === 0) {
      await createAuditLog({
        actionType: "verify_email",
        targetEntity: "email_verification",
        resultStatus: "failed",
        ipAddress,
        details: "Invalid verification token."
      });

      return res.status(400).json({
        ok: false,
        message: "Invalid verification token."
      });
    }

    const verification = verificationResult.rows[0];

    if (verification.is_used) {
      return res.status(400).json({
        ok: false,
        message: "This verification token has already been used."
      });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({
        ok: false,
        message: "This verification token has expired."
      });
    }

    await query(
      `UPDATE users SET is_email_verified = TRUE, updated_at = NOW() WHERE id = $1`,
      [verification.user_id]
    );

    await query(
      `UPDATE email_verifications SET is_used = TRUE WHERE id = $1`,
      [verification.id]
    );

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        verification.user_id,
        "account_activity",
        "Email verified",
        "Your email has been successfully verified."
      ]
    );

    await createAuditLog({
      userId: verification.user_id,
      role: verification.role,
      actionType: "verify_email",
      targetEntity: "email_verification",
      resultStatus: "success",
      ipAddress,
      details: "Email verification completed."
    });

    return res.json({
      ok: true,
      message: "Email verified successfully."
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Email verification failed.",
      error: error.message
    });
  }
}

export async function login(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await createAuditLog({
        actionType: "login",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: "Missing email or password."
      });

      return res.status(400).json({
        ok: false,
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userResult = await query(
      `
        SELECT id, full_name, email, password_hash, role, is_email_verified, is_active
        FROM users
        WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      await createAuditLog({
        actionType: "login",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: `User not found for email ${normalizedEmail}`
      });

      return res.status(401).json({
        ok: false,
        message: "Invalid email or password."
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      await createAuditLog({
        userId: user.id,
        role: user.role,
        actionType: "login",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: "Inactive account login attempt."
      });

      return res.status(403).json({
        ok: false,
        message: "Your account is inactive."
      });
    }

    if (!user.is_email_verified) {
      await createAuditLog({
        userId: user.id,
        role: user.role,
        actionType: "login",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: "Login attempted before email verification."
      });

      return res.status(403).json({
        ok: false,
        message: "Please verify your email before logging in."
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await createAuditLog({
        userId: user.id,
        role: user.role,
        actionType: "failed_login",
        targetEntity: "user",
        resultStatus: "failed",
        ipAddress,
        details: "Incorrect password."
      });

      return res.status(401).json({
        ok: false,
        message: "Invalid email or password."
      });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    });

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        user.id,
        "account_activity",
        "New login",
        "A new login to your account was detected."
      ]
    );

    await createAuditLog({
      userId: user.id,
      role: user.role,
      actionType: "login",
      targetEntity: "user",
      resultStatus: "success",
      ipAddress,
      details: "User login successful."
    });

    return res.json({
      ok: true,
      message: "Login successful.",
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.is_email_verified
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Login failed.",
      error: error.message
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await query(
      `
        SELECT
          id,
          full_name,
          email,
          role,
          institution,
          expertise,
          city,
          country,
          is_email_verified,
          is_active,
          profile_completeness,
          created_at
        FROM users
        WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found."
      });
    }

    return res.json({
      ok: true,
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch current user.",
      error: error.message
    });
  }
}
