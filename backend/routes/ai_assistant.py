"""
routes/ai_assistant.py
Blueprint for AI chat assistant and agentic worker endpoints.
Prefix: /api/ai
"""

from flask import Blueprint, request, jsonify
from services.ai_service import process_message, clear_session
from services.agent_service import agent_worker

ai_bp = Blueprint("ai_bp", __name__, url_prefix="/api/ai")


# ---------------------------------------------------------------------------
# POST /api/ai/chat
# ---------------------------------------------------------------------------
@ai_bp.route("/chat", methods=["POST"])
def chat():
    """
    Send a natural-language message to the AI assistant.

    Request body (JSON):
        message    (str)  – user message text
        session_id (str)  – unique conversation session ID (e.g. UUID)
        context    (dict) – optional extra context: { user_id, location, ... }
    """
    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default").strip()
    context = data.get("context", {})

    if not message:
        return jsonify({"success": False, "error": "'message' field is required."}), 400

    try:
        response = process_message(
            message=message,
            session_id=session_id,
            context=context,
        )
        return jsonify({"success": True, **response})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /api/ai/agent
# ---------------------------------------------------------------------------
@ai_bp.route("/agent", methods=["POST"])
def agent():
    """
    Submit a multi-step instruction to the autonomous booking agent.

    Request body (JSON):
        instruction (str)  – natural language booking task
                             e.g. "Book a 5-star hotel in Goa for 2 guests on 2026-12-20"
        context     (dict) – optional: { user_id, checkin, checkout, ... }
    """
    data = request.get_json(silent=True) or {}

    instruction = data.get("instruction", "").strip()
    context = data.get("context", {})

    if not instruction:
        return jsonify({"success": False, "error": "'instruction' field is required."}), 400

    try:
        result = agent_worker.execute(instruction=instruction, context=context)
        return jsonify({"success": True, **result})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# DELETE /api/ai/chat/<session_id>
# ---------------------------------------------------------------------------
@ai_bp.route("/chat/<session_id>", methods=["DELETE"])
def clear_chat_session(session_id: str):
    """Clear all conversation history and state for the given session."""
    clear_session(session_id)
    return jsonify({
        "success": True,
        "message": f"Session '{session_id}' cleared.",
    })
