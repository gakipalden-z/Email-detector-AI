import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re
from dotenv import load_dotenv
import os



# =========================
# CONFIG
# =========================
MODEL_PATH = "../model/distilbert_phishing_model"
MAX_LENGTH = 256
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

id2label = {
    0: "Safe Email",
    1: "Phishing Email"
}

# =========================
# LOAD MODEL (LOAD ONCE!)
# =========================
print("Loading model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, token=HF_TOKEN)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

print("Model loaded successfully.")

# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Phishing Email Detection API")

# explanation 
def explain_email(text, prediction):
    print("Generating explanation for the email...", prediction)
    text_lower = text.lower()

    reasons = []

    # 🚨 Urgency indicators
    urgency_keywords = ["urgent", "immediately", "now", "asap", "suspended", "limited time"]
    if any(word in text_lower for word in urgency_keywords):
        reasons.append("The email creates urgency (e.g., 'urgent', 'immediately'), which is common in phishing attacks.")

    # 🔐 Credential / verification requests
    credential_keywords = ["verify", "login", "password", "account", "confirm", "update"]
    if any(word in text_lower for word in credential_keywords):
        reasons.append("The email asks for account verification or login details, which may indicate credential harvesting.")

    # 🔗 Suspicious links
    if "http" in text_lower or "www" in text_lower:
        reasons.append("The email contains links, which could redirect to malicious websites.")

    # 💰 Financial bait
    money_keywords = ["bank", "payment", "invoice", "transfer", "refund", "prize"]
    if any(word in text_lower for word in money_keywords):
        reasons.append("The email references financial matters, a common phishing tactic.")

    # ⚠️ Threat / fear language
    threat_keywords = ["suspended", "blocked", "terminated", "legal action"]
    if any(word in text_lower for word in threat_keywords):
        reasons.append("The email uses threatening language to pressure the user.")

    # 🧠 Final response
    if reasons:
        return " | ".join(reasons)
    else:
        return "No strong phishing indicators found."



# =========================
# REQUEST SCHEMA
# =========================
class EmailRequest(BaseModel):
    email_text: str


# =========================
# PREDICTION FUNCTION
# =========================
def predict_email(text):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
        padding=True
    )

    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits

    probs = torch.nn.functional.softmax(logits, dim=-1)
    pred_class = torch.argmax(probs, dim=-1).item()
    confidence = probs[0][pred_class].item()

    label = "Safe Email" if pred_class == 0 else "Phishing Email"
    explanation = explain_email(text, label)

    return {
        "label": id2label[pred_class],
        "confidence": round(confidence, 4),
        "explanation": explanation
    }


# =========================
# API ENDPOINT
# =========================
@app.post("/predict")
def predict(req: EmailRequest):
    result = predict_email(req.email_text)
    return {
        "input": req.email_text,
        "prediction": result["label"],
        "confidence": result["confidence"],
        "explanation": result["explanation"]
    }


# =========================
# HEALTH CHECK
# =========================
@app.get("/")
def home():
    return {"message": "API is running"}

# ========================
# RUN WITH: uvicorn api:app --reload
# ========================