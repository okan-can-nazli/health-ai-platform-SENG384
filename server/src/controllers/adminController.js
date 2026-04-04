import { query } from "../config/db.js";
import { createAuditLog } from "../services/auditService.js";

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

export async function getAdminUsers(req, res) {
  try {
    const { role, active } = req.query;

    const conditions = [];
    const values = [];

    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    if (active === "true" || active === "false") {
      values.push(active === "true");
      conditions.push(`is_active = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `
        SELECT
          id,
          full_name,
          email,
          role,
          institution,
          city,
          country,
          is_email_verified,
          is_active,
          profile_completeness,
          created_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
    );

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch users.",
      error: error.message
    });
  }
}

export async function updateUserStatus(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "isActive must be a boolean."
      });
    }

    const existing = await query(
      `SELECT id, role FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found."
      });
    }

    const result = await query(
      `
        UPDATE users
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, full_name, email, role, is_active
      `,
      [isActive, req.params.id]
    );

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        req.params.id,
        "account_activity",
        "Account status updated",
        `Your account has been ${isActive ? "activated" : "deactivated"} by admin.`
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "admin_user_status_update",
      targetEntity: "user",
      resultStatus: "success",
      ipAddress,
      details: `Admin updated user ${req.params.id} active=${isActive}`
    });

    return res.json({
      ok: true,
      message: "User status updated successfully.",
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update user status.",
      error: error.message
    });
  }
}

export async function getAdminPosts(req, res) {
  try {
    const { city, domain, status } = req.query;

    const conditions = [];
    const values = [];

    if (city) {
      values.push(city);
      conditions.push(`p.city ILIKE '%' || $${values.length} || '%'`);
    }

    if (domain) {
      values.push(domain);
      conditions.push(`p.working_domain ILIKE '%' || $${values.length} || '%'`);
    }

    if (status) {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `
        SELECT
          p.*,
          u.full_name AS owner_name,
          u.email AS owner_email
        FROM posts p
        JOIN users u ON u.id = p.user_id
        ${whereClause}
        ORDER BY p.created_at DESC
      `,
      values
    );

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch admin posts.",
      error: error.message
    });
  }
}

export async function deletePostAsAdmin(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const existing = await query(
      `SELECT id, user_id, title FROM posts WHERE id = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Post not found."
      });
    }

    const post = existing.rows[0];

    await query(`DELETE FROM posts WHERE id = $1`, [req.params.id]);

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        post.user_id,
        "post_status_changed",
        "Post removed by admin",
        `Your post "${post.title}" has been removed by admin.`
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "admin_post_delete",
      targetEntity: "post",
      resultStatus: "success",
      ipAddress,
      details: `Admin deleted post ${req.params.id}`
    });

    return res.json({
      ok: true,
      message: "Post deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to delete post.",
      error: error.message
    });
  }
}

export async function getActivityLogs(req, res) {
  try {
    const { userId, action, dateFrom, dateTo } = req.query;

    const conditions = [];
    const values = [];

    if (userId) {
      values.push(userId);
      conditions.push(`user_id = $${values.length}`);
    }

    if (action) {
      values.push(action);
      conditions.push(`action_type ILIKE '%' || $${values.length} || '%'`);
    }

    if (dateFrom) {
      values.push(dateFrom);
      conditions.push(`created_at >= $${values.length}`);
    }

    if (dateTo) {
      values.push(dateTo);
      conditions.push(`created_at <= $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `
        SELECT *
        FROM activity_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 500
      `,
      values
    );

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch logs.",
      error: error.message
    });
  }
}

export async function exportActivityLogsCsv(req, res) {
  try {
    const result = await query(
      `
        SELECT
          id,
          user_id,
          role,
          action_type,
          target_entity,
          result_status,
          ip_address,
          details,
          created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 1000
      `
    );

    const headers = [
      "id",
      "user_id",
      "role",
      "action_type",
      "target_entity",
      "result_status",
      "ip_address",
      "details",
      "created_at"
    ];

    const rows = result.rows.map((row) =>
      [
        row.id,
        row.user_id,
        row.role,
        row.action_type,
        row.target_entity,
        row.result_status,
        row.ip_address,
        row.details,
        row.created_at
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="activity_logs.csv"');

    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to export logs.",
      error: error.message
    });
  }
}
