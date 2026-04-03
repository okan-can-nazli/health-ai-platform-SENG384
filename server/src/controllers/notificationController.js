import { query } from "../config/db.js";

export async function getMyNotifications(req, res) {
  try {
    const result = await query(
      `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch notifications.",
      error: error.message
    });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const result = await query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found."
      });
    }

    return res.json({
      ok: true,
      message: "Notification marked as read.",
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update notification.",
      error: error.message
    });
  }
}
