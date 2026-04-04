import { query } from "../config/db.js";
import { createAuditLog } from "../services/auditService.js";

const ALLOWED_STATUSES = [
  "draft",
  "active",
  "meeting_scheduled",
  "partner_found",
  "expired"
];

function normalizePostRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    expertiseRequired: row.expertise_required,
    workingDomain: row.working_domain,
    shortExplanation: row.short_explanation,
    desiredTechnicalExpertise: row.desired_technical_expertise,
    neededHealthcareExpertise: row.needed_healthcare_expertise,
    highLevelIdea: row.high_level_idea,
    levelOfCommitmentRequired: row.level_of_commitment_required,
    estimatedCollaborationType: row.estimated_collaboration_type,
    confidentialityLevel: row.confidentiality_level,
    expiryDate: row.expiry_date,
    autoClose: row.auto_close,
    projectStage: row.project_stage,
    country: row.country,
    city: row.city,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validatePostInput(body) {
  const requiredFields = [
    "title",
    "expertiseRequired",
    "workingDomain",
    "shortExplanation",
    "levelOfCommitmentRequired",
    "confidentialityLevel",
    "projectStage",
    "country",
    "city"
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return `${field} is required.`;
    }
  }

  if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
    return "Invalid post status.";
  }

  return null;
}

export async function createPost(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const validationError = validatePostInput(req.body);
    if (validationError) {
      return res.status(400).json({
        ok: false,
        message: validationError
      });
    }

    const {
      title,
      expertiseRequired,
      workingDomain,
      shortExplanation,
      desiredTechnicalExpertise,
      neededHealthcareExpertise,
      highLevelIdea,
      levelOfCommitmentRequired,
      estimatedCollaborationType,
      confidentialityLevel,
      expiryDate,
      autoClose,
      projectStage,
      country,
      city,
      status
    } = req.body;

    const result = await query(
      `
        INSERT INTO posts (
          user_id,
          title,
          expertise_required,
          working_domain,
          short_explanation,
          desired_technical_expertise,
          needed_healthcare_expertise,
          high_level_idea,
          level_of_commitment_required,
          estimated_collaboration_type,
          confidentiality_level,
          expiry_date,
          auto_close,
          project_stage,
          country,
          city,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        RETURNING *
      `,
      [
        req.user.id,
        title,
        expertiseRequired,
        workingDomain,
        shortExplanation,
        desiredTechnicalExpertise || null,
        neededHealthcareExpertise || null,
        highLevelIdea || null,
        levelOfCommitmentRequired,
        estimatedCollaborationType || null,
        confidentialityLevel,
        expiryDate || null,
        autoClose ?? false,
        projectStage,
        country,
        city,
        status || "draft"
      ]
    );

    const post = result.rows[0];

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "post_create",
      targetEntity: "post",
      resultStatus: "success",
      ipAddress,
      details: `Post created with id ${post.id}`
    });

    return res.status(201).json({
      ok: true,
      message: "Post created successfully.",
      data: normalizePostRow(post)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to create post.",
      error: error.message
    });
  }
}

export async function getAllPosts(req, res) {
  try {
    const { domain, expertise, city, country, stage, status, mine } = req.query;

    const conditions = [];
    const values = [];

    if (domain) {
      values.push(domain);
      conditions.push(`working_domain ILIKE '%' || $${values.length} || '%'`);
    }

    if (expertise) {
      values.push(expertise);
      conditions.push(`expertise_required ILIKE '%' || $${values.length} || '%'`);
    }

    if (city) {
      values.push(city);
      conditions.push(`city ILIKE '%' || $${values.length} || '%'`);
    }

    if (country) {
      values.push(country);
      conditions.push(`country ILIKE '%' || $${values.length} || '%'`);
    }

    if (stage) {
      values.push(stage);
      conditions.push(`project_stage ILIKE '%' || $${values.length} || '%'`);
    }

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (mine === "true") {
      values.push(req.user.id);
      conditions.push(`user_id = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `
        SELECT *
        FROM posts
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
    );

    return res.json({
      ok: true,
      data: result.rows.map(normalizePostRow)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch posts.",
      error: error.message
    });
  }
}

export async function getPostById(req, res) {
  try {
    const result = await query(
      `
        SELECT *
        FROM posts
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Post not found."
      });
    }

    return res.json({
      ok: true,
      data: normalizePostRow(result.rows[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch post.",
      error: error.message
    });
  }
}

export async function updatePost(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const existing = await query(
      `SELECT * FROM posts WHERE id = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Post not found."
      });
    }

    const post = existing.rows[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).json({
        ok: false,
        message: "You can only edit your own posts."
      });
    }

    const updatedFields = {
      title: req.body.title ?? post.title,
      expertiseRequired: req.body.expertiseRequired ?? post.expertise_required,
      workingDomain: req.body.workingDomain ?? post.working_domain,
      shortExplanation: req.body.shortExplanation ?? post.short_explanation,
      desiredTechnicalExpertise:
        req.body.desiredTechnicalExpertise ?? post.desired_technical_expertise,
      neededHealthcareExpertise:
        req.body.neededHealthcareExpertise ?? post.needed_healthcare_expertise,
      highLevelIdea: req.body.highLevelIdea ?? post.high_level_idea,
      levelOfCommitmentRequired:
        req.body.levelOfCommitmentRequired ?? post.level_of_commitment_required,
      estimatedCollaborationType:
        req.body.estimatedCollaborationType ?? post.estimated_collaboration_type,
      confidentialityLevel:
        req.body.confidentialityLevel ?? post.confidentiality_level,
      expiryDate: req.body.expiryDate ?? post.expiry_date,
      autoClose: req.body.autoClose ?? post.auto_close,
      projectStage: req.body.projectStage ?? post.project_stage,
      country: req.body.country ?? post.country,
      city: req.body.city ?? post.city
    };

    const result = await query(
      `
        UPDATE posts
        SET
          title = $1,
          expertise_required = $2,
          working_domain = $3,
          short_explanation = $4,
          desired_technical_expertise = $5,
          needed_healthcare_expertise = $6,
          high_level_idea = $7,
          level_of_commitment_required = $8,
          estimated_collaboration_type = $9,
          confidentiality_level = $10,
          expiry_date = $11,
          auto_close = $12,
          project_stage = $13,
          country = $14,
          city = $15,
          updated_at = NOW()
        WHERE id = $16
        RETURNING *
      `,
      [
        updatedFields.title,
        updatedFields.expertiseRequired,
        updatedFields.workingDomain,
        updatedFields.shortExplanation,
        updatedFields.desiredTechnicalExpertise,
        updatedFields.neededHealthcareExpertise,
        updatedFields.highLevelIdea,
        updatedFields.levelOfCommitmentRequired,
        updatedFields.estimatedCollaborationType,
        updatedFields.confidentialityLevel,
        updatedFields.expiryDate,
        updatedFields.autoClose,
        updatedFields.projectStage,
        updatedFields.country,
        updatedFields.city,
        req.params.id
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "post_edit",
      targetEntity: "post",
      resultStatus: "success",
      ipAddress,
      details: `Post updated with id ${req.params.id}`
    });

    return res.json({
      ok: true,
      message: "Post updated successfully.",
      data: normalizePostRow(result.rows[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update post.",
      error: error.message
    });
  }
}

export async function updatePostStatus(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid status."
      });
    }

    const existing = await query(
      `SELECT * FROM posts WHERE id = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Post not found."
      });
    }

    const post = existing.rows[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).json({
        ok: false,
        message: "You can only change your own post status."
      });
    }

    const result = await query(
      `
        UPDATE posts
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [status, req.params.id]
    );

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        req.user.id,
        "post_status_changed",
        "Post status updated",
        `Your post status has been changed to ${status}.`
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "post_status_change",
      targetEntity: "post",
      resultStatus: "success",
      ipAddress,
      details: `Post ${req.params.id} status changed to ${status}`
    });

    return res.json({
      ok: true,
      message: "Post status updated successfully.",
      data: normalizePostRow(result.rows[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update post status.",
      error: error.message
    });
  }
}
