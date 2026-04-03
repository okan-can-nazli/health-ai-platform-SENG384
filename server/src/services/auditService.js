import { query } from "../config/db.js";

export async function createAuditLog({
  userId = null,
  role = null,
  actionType,
  targetEntity = null,
  resultStatus,
  ipAddress = null,
  details = null
}) {
  await query(
    `
      INSERT INTO activity_logs (
        user_id,
        role,
        action_type,
        target_entity,
        result_status,
        ip_address,
        details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [userId, role, actionType, targetEntity, resultStatus, ipAddress, details]
  );
}
