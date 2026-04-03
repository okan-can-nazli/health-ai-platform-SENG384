import { query } from "../config/db.js";
import { createAuditLog } from "../services/auditService.js";

const ALLOWED_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "scheduled",
  "completed"
];

function normalizeMeetingRow(row) {
  return {
    id: row.id,
    postId: row.post_id,
    requesterId: row.requester_id,
    postOwnerId: row.post_owner_id,
    requestMessage: row.request_message,
    proposedTimeSlots: row.proposed_time_slots,
    selectedTimeSlot: row.selected_time_slot,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createMeetingRequest(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { postId, requestMessage, proposedTimeSlots, ndaAccepted } = req.body;

    if (!postId || !proposedTimeSlots) {
      return res.status(400).json({
        ok: false,
        message: "postId and proposedTimeSlots are required."
      });
    }

    const postResult = await query(
      `SELECT * FROM posts WHERE id = $1`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Post not found."
      });
    }

    const post = postResult.rows[0];

    if (post.user_id === req.user.id) {
      return res.status(400).json({
        ok: false,
        message: "You cannot send a meeting request to your own post."
      });
    }

    if (post.status === "partner_found" || post.status === "expired") {
      return res.status(400).json({
        ok: false,
        message: "This post is not available for meeting requests."
      });
    }

    if (!ndaAccepted) {
      return res.status(400).json({
        ok: false,
        message: "NDA acceptance is required before sending a meeting request."
      });
    }

    await query(
      `
        INSERT INTO nda_acceptances (post_id, accepted_by_user_id)
        VALUES ($1, $2)
        ON CONFLICT (post_id, accepted_by_user_id) DO NOTHING
      `,
      [postId, req.user.id]
    );

    const existingRequest = await query(
      `
        SELECT id
        FROM meeting_requests
        WHERE post_id = $1 AND requester_id = $2 AND status IN ('pending', 'accepted', 'scheduled')
      `,
      [postId, req.user.id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "You already have an active meeting request for this post."
      });
    }

    const result = await query(
      `
        INSERT INTO meeting_requests (
          post_id,
          requester_id,
          post_owner_id,
          request_message,
          proposed_time_slots,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *
      `,
      [
        postId,
        req.user.id,
        post.user_id,
        requestMessage || null,
        proposedTimeSlots
      ]
    );

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        post.user_id,
        "meeting_request",
        "New meeting request",
        "Someone sent a meeting request for your post."
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "meeting_request_create",
      targetEntity: "meeting_request",
      resultStatus: "success",
      ipAddress,
      details: `Meeting request created for post ${postId}`
    });

    return res.status(201).json({
      ok: true,
      message: "Meeting request sent successfully.",
      data: normalizeMeetingRow(result.rows[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to create meeting request.",
      error: error.message
    });
  }
}

export async function getMeetingRequests(req, res) {
  try {
    const { type = "all" } = req.query;

    let result;

    if (type === "incoming") {
      result = await query(
        `
          SELECT *
          FROM meeting_requests
          WHERE post_owner_id = $1
          ORDER BY created_at DESC
        `,
        [req.user.id]
      );
    } else if (type === "outgoing") {
      result = await query(
        `
          SELECT *
          FROM meeting_requests
          WHERE requester_id = $1
          ORDER BY created_at DESC
        `,
        [req.user.id]
      );
    } else {
      result = await query(
        `
          SELECT *
          FROM meeting_requests
          WHERE requester_id = $1 OR post_owner_id = $1
          ORDER BY created_at DESC
        `,
        [req.user.id]
      );
    }

    return res.json({
      ok: true,
      data: result.rows.map(normalizeMeetingRow)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch meeting requests.",
      error: error.message
    });
  }
}

export async function updateMeetingRequestStatus(req, res) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    const { status, selectedTimeSlot } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid meeting request status."
      });
    }

    const existingResult = await query(
      `SELECT * FROM meeting_requests WHERE id = $1`,
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Meeting request not found."
      });
    }

    const meetingRequest = existingResult.rows[0];

    const isOwner = meetingRequest.post_owner_id === req.user.id;
    const isRequester = meetingRequest.requester_id === req.user.id;

    if (!isOwner && !isRequester) {
      return res.status(403).json({
        ok: false,
        message: "You do not have permission to modify this meeting request."
      });
    }

    if (status === "accepted" && !isOwner) {
      return res.status(403).json({
        ok: false,
        message: "Only the post owner can accept a meeting request."
      });
    }

    if (status === "declined" && !isOwner) {
      return res.status(403).json({
        ok: false,
        message: "Only the post owner can decline a meeting request."
      });
    }

    if (status === "scheduled" && !isOwner) {
      return res.status(403).json({
        ok: false,
        message: "Only the post owner can schedule a meeting request."
      });
    }

    if (status === "cancelled" && !isRequester && !isOwner) {
      return res.status(403).json({
        ok: false,
        message: "Only involved users can cancel the meeting request."
      });
    }

    const result = await query(
      `
        UPDATE meeting_requests
        SET
          status = $1,
          selected_time_slot = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
      [status, selectedTimeSlot || null, req.params.id]
    );

    if (status === "scheduled") {
      await query(
        `
          UPDATE posts
          SET status = 'meeting_scheduled', updated_at = NOW()
          WHERE id = $1
        `,
        [meetingRequest.post_id]
      );
    }

    const notifyUserId =
      req.user.id === meetingRequest.post_owner_id
        ? meetingRequest.requester_id
        : meetingRequest.post_owner_id;

    await query(
      `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        notifyUserId,
        "meeting_confirmed",
        "Meeting request updated",
        `A meeting request status has been changed to ${status}.`
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      role: req.user.role,
      actionType: "meeting_request_status_update",
      targetEntity: "meeting_request",
      resultStatus: "success",
      ipAddress,
      details: `Meeting request ${req.params.id} updated to ${status}`
    });

    return res.json({
      ok: true,
      message: "Meeting request status updated successfully.",
      data: normalizeMeetingRow(result.rows[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update meeting request status.",
      error: error.message
    });
  }
}
