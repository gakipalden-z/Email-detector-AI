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

    return {
        "label": id2label[pred_class],
        "confidence": round(confidence, 4)
    }

# flag
def detect_flags(text: str):
    flags = []

    # 🔥 Urgency
    if re.search(r"\b(urgent|immediately|act now|asap|right away)\b", text, re.I):
        flags.append("Urgency language detected")

    # 🔥 Suspicious links
    if re.search(r"http[s]?://", text):
        flags.append("Contains link")

    # 🔥 Credential request
    if re.search(r"\b(password|verify|login|account|bank|otp)\b", text, re.I):
        flags.append("Requests sensitive information")

    # 🔥 Threat language
    if re.search(r"\b(suspended|blocked|locked|terminated)\b", text, re.I):
        flags.append("Threat or pressure language")

    # 🔥 Email spoofing clues
    if re.search(r"\b(dear user|dear customer)\b", text, re.I):
        flags.append("Generic greeting")
    else:
        flags.append("no flags detected")

    return flags

# =========================
# API ENDPOINT
# =========================
@app.post("/predict")
def predict(req: EmailRequest):
    result = predict_email(req.email_text)
    flags = detect_flags(req.email_text)
    return {
        "input": req.email_text,
        "prediction": result["label"],
        "confidence": result["confidence"],
        "flags": flags
    }


# =========================
# HEALTH CHECK
# =========================
@app.get("/")
def home():
    return {"message": "API is running"}