import os
import sys
import time
import base64
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

try:
    from google import genai
    from google.genai import types
except ImportError as exc:
    raise SystemExit(
        "Gemini SDK is missing. Install it with: pip install google-genai"
    ) from exc


def load_env_file():
    candidates = [
        Path(__file__).resolve().parent / ".env",
        Path.cwd() / ".env",
    ]

    for env_path in candidates:
        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


load_env_file()

client = None


def get_client():
    global client
    if client is not None:
        return client
    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("API_KEY")
        or os.getenv("API_key")
    )
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it in Vercel / Environment Variables."
        )
    client = genai.Client(api_key=api_key)
    return client


# Active Gemini models with verified availability and quotas
MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
]


def extract_text_from_response(response):
    text = getattr(response, "text", None)
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    if candidates:
        first = candidates[0]
        content = getattr(first, "content", None)
        if content is not None:
            parts = getattr(content, "parts", None) or []
            for part in parts:
                if hasattr(part, "text") and part.text:
                    return part.text

    return "No response generated."


def generate_with_fallback(contents):
    ai_client = get_client()
    last_error = None
    for model_name in MODELS:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=contents,
            )
            text = extract_text_from_response(response)
            return text, model_name
        except Exception as exc:
            last_error = exc
            err_msg = str(exc)
            # If rate-limited, high demand, or retired model, try next model immediately
            if any(k in err_msg for k in ["429", "503", "404", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "NOT_FOUND"]):
                continue
            continue

    raise last_error or RuntimeError("Failed to generate response from all models.")


# Flask App Setup
DIST_DIR = Path(__file__).resolve().parent / "frontend" / "frontend" / "dist"

app = Flask(
    __name__,
    static_folder=str(DIST_DIR / "assets") if (DIST_DIR / "assets").exists() else None,
    static_url_path="/assets",
)
CORS(app)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "Endpoint not found"}), 404

    target = DIST_DIR / path
    if path and target.exists() and not target.is_dir():
        return send_from_directory(DIST_DIR, path)

    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return send_from_directory(DIST_DIR, "index.html")

    return (
        "Frontend build not found. Run 'npm run build' inside frontend/frontend.",
        404,
    )


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models": MODELS,
    })


@app.route("/api/chat", methods=["POST"])
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    raw_messages = data.get("messages")
    prompt = data.get("message") or data.get("prompt")
    top_image_b64 = data.get("image")
    top_mime_type = data.get("mime_type") or "image/jpeg"

    formatted_contents = []

    def make_image_part(b64_str, mime="image/jpeg"):
        if not b64_str:
            return None
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        try:
            raw_bytes = base64.b64decode(b64_str)
            return types.Part.from_bytes(data=raw_bytes, mime_type=mime)
        except Exception:
            return None

    if raw_messages and isinstance(raw_messages, list):
        for idx, msg in enumerate(raw_messages):
            if not isinstance(msg, dict):
                continue
            role = msg.get("role", "user")
            if role not in ("user", "model"):
                role = "user"

            parts_list = []

            # Handle attached image for this message
            msg_image = msg.get("image")
            msg_mime = msg.get("mime_type") or top_mime_type or "image/jpeg"

            # If top-level image was passed and this is the latest message
            if idx == len(raw_messages) - 1 and top_image_b64 and not msg_image:
                msg_image = top_image_b64
                msg_mime = top_mime_type

            if msg_image and role == "user":
                img_part = make_image_part(msg_image, msg_mime)
                if img_part:
                    parts_list.append(img_part)

            parts = msg.get("parts", [])
            text_parts = []
            if isinstance(parts, list):
                for p in parts:
                    if isinstance(p, dict) and "text" in p and p["text"]:
                        text_parts.append(str(p["text"]))
                    elif isinstance(p, str) and p:
                        text_parts.append(p)
            elif isinstance(parts, str) and parts:
                text_parts.append(parts)

            combined_text = "\n".join(text_parts).strip()
            if combined_text:
                parts_list.append(types.Part.from_text(text=combined_text))
            elif parts_list and not combined_text:
                parts_list.append(types.Part.from_text(text="Please analyze and describe this image."))

            if parts_list:
                formatted_contents.append(
                    types.Content(
                        role=role,
                        parts=parts_list,
                    )
                )

    elif prompt or top_image_b64:
        parts_list = []
        if top_image_b64:
            img_part = make_image_part(top_image_b64, top_mime_type)
            if img_part:
                parts_list.append(img_part)
        text_str = str(prompt).strip() if prompt else "Please analyze and describe this image."
        parts_list.append(types.Part.from_text(text=text_str))

        formatted_contents = [
            types.Content(
                role="user",
                parts=parts_list,
            )
        ]

    if not formatted_contents:
        return jsonify({"error": "No prompt or messages provided"}), 400

    try:
        reply_text, used_model = generate_with_fallback(formatted_contents)
        return jsonify({
            "reply": reply_text,
            "model": used_model,
        })
    except Exception as exc:
        err_str = str(exc)
        if "503" in err_str or "UNAVAILABLE" in err_str:
            return jsonify({
                "error": "The Gemini service is temporarily busy. Please try sending your message again in a few seconds."
            }), 503
        elif "429" in err_str:
            return jsonify({
                "error": "API quota or rate limit exceeded. Please check your Gemini API plan."
            }), 429
        elif "401" in err_str or "403" in err_str:
            return jsonify({
                "error": "Authentication error with Gemini API key. Please check your .env key."
            }), 401
        else:
            return jsonify({
                "error": f"Error: {err_str}"
            }), 500


def run_cli():
    print("Gemini CLI Chatbot Started!")
    print("Type 'exit' to stop")

    while True:
        prompt = input("\nYou: ")
        if not prompt or not prompt.strip():
            continue
        if prompt.lower() == "exit":
            print("Chatbot closed!")
            break

        try:
            reply, model = generate_with_fallback(prompt)
            print(f"\nGemini ({model}):", reply)
        except Exception as exc:
            print("\nError:", exc)


def run_server():
    port = int(os.environ.get("PORT", 5000))
    print("==================================================")
    print("[*] GenTalk Backend Server starting...")
    print(f"[+] Website URL: http://localhost:{port}")
    print(f"[+] API endpoint: http://localhost:{port}/api/chat")
    print("==================================================")
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        run_cli()
    else:
        run_server()
