from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import traceback
import torch
import re
import joblib
import shutil
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import numpy as np

# Load environment variables
load_dotenv()

# =========================
# CONFIGURATION
# =========================
class Config:
    DATASET_DIR = "../backend-server/uploads/datasets"
    MODEL_DIR = "./models"
    UPLOAD_DIR = "../backend-server/uploads"
    PROCESSED_DATA="../backend-server/uploads/processed"
    MAX_LENGTH = 256
    HF_TOKEN = os.getenv("HF_TOKEN")
    
    # Model labels
    PHISHING_ID2LABEL = {
        0: "Safe Email",
        1: "Phishing Email"
    }
    
    # Ensure directories exist
    os.makedirs(DATASET_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

config = Config()

# =========================
# REQUEST/RESPONSE MODELS
# =========================
class EmailRequest(BaseModel):
    email_text: str

class PreprocessRequest(BaseModel):
    dataset: str
    column: str

class TrainRequest(BaseModel):
    dataset: str
    text_column: str
    label_column: str
    model: str  # "logistic" or "distilbert"

class TrainResponse(BaseModel):
    model: str
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    message: Optional[str] = None
    label_mapping: Optional[Dict] = None

# =========================
# REUSABLE UTILITIES
# =========================

class DatasetManager:
    """Reusable dataset operations"""
    
    @staticmethod
    def load_dataset(dataset_name: str) -> pd.DataFrame:
        """Load CSV dataset with error handling"""
        file_path = os.path.join(config.DATASET_DIR, dataset_name)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset not found: {dataset_name}")
        
        return pd.read_csv(file_path, engine="python", on_bad_lines="skip")
    
    @staticmethod
    def validate_columns(df: pd.DataFrame, required_columns: List[str]) -> Dict:
        """Validate required columns exist"""
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            return {
                "valid": False,
                "error": f"Missing columns: {missing}",
                "available": list(df.columns)
            }
        return {"valid": True}
    
    @staticmethod
    def preprocess_text_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Standard text preprocessing"""
        df[column] = df[column].astype(str).str.lower().str.strip()
        return df
    
    @staticmethod
    def save_processed_dataset(df: pd.DataFrame, original_name: str) -> str:
        """Save processed dataset with prefix"""
        processed_name = f"processed_{original_name}"
        processed_path = os.path.join(config.PROCESSED_DATA, processed_name)
        df.to_csv(processed_path, index=False)
        return processed_name

class PhishingDetector:
    """Reusable phishing detection utilities"""
    
    @staticmethod
    def extract_phishing_indicators(text: str) -> List[str]:
        """Extract phishing indicators from text"""
        text_lower = text.lower()
        reasons = []
        
        indicators = {
            "urgency": ["urgent", "immediately", "now", "asap", "suspended", "limited time"],
            "credentials": ["verify", "login", "password", "account", "confirm", "update"],
            "links": ["http", "www"],
            "financial": ["bank", "payment", "invoice", "transfer", "refund", "prize"],
            "threats": ["suspended", "blocked", "terminated", "legal action"]
        }
        
        for category, keywords in indicators.items():
            if any(word in text_lower for word in keywords):
                if category == "urgency":
                    reasons.append("The email creates urgency (e.g., 'urgent', 'immediately'), which is common in phishing attacks.")
                elif category == "credentials":
                    reasons.append("The email asks for account verification or login details, which may indicate credential harvesting.")
                elif category == "links":
                    reasons.append("The email contains links, which could redirect to malicious websites.")
                elif category == "financial":
                    reasons.append("The email references financial matters, a common phishing tactic.")
                elif category == "threats":
                    reasons.append("The email uses threatening language to pressure the user.")
        
        return reasons if reasons else ["No strong phishing indicators found."]
    
    @staticmethod
    def generate_explanation(text: str, prediction: str) -> str:
        """Generate human-readable explanation"""
        reasons = PhishingDetector.extract_phishing_indicators(text)
        return " | ".join(reasons)

class ModelTrainer:
    """Reusable model training utilities"""
    
    def __init__(self):
        self.loaded_models = {}  # Cache for loaded models
    
    def train_logistic_regression(self, X_train, X_test, y_train, y_test, dataset_name: str) -> Dict:
        """Train logistic regression model"""
        vectorizer = TfidfVectorizer(max_features=5000)
        X_train_vec = vectorizer.fit_transform(X_train)
        X_test_vec = vectorizer.transform(X_test)
        
        model = LogisticRegression(max_iter=200)
        model.fit(X_train_vec, y_train)
        
        y_pred = model.predict(X_test_vec)
        
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted")
        
        # Save models
        joblib.dump(model, os.path.join(config.MODEL_DIR, f"logistic_{dataset_name}.pkl"))
        joblib.dump(vectorizer, os.path.join(config.MODEL_DIR, f"vectorizer_{dataset_name}.pkl"))
        
        return {
            "model": "Logistic Regression",
            "accuracy": acc,
            "f1_score": f1
        }
    
    def train_distilbert(self, df: pd.DataFrame, text_column: str, label_column: str, dataset_name: str) -> Dict:
        """Train DistilBERT model"""
        # Prepare data
        label_mapping = {label: idx for idx, label in enumerate(df[label_column].unique())}
        df["label"] = df[label_column].map(label_mapping)
        df = df[[text_column, "label"]]
        
        # Convert to HuggingFace dataset
        dataset = Dataset.from_pandas(df)
        dataset = dataset.train_test_split(test_size=0.2)
        
        # Tokenize
        tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
        
        def tokenize_function(examples):
            return tokenizer(examples[text_column], truncation=True, padding="max_length", max_length=128)
        
        dataset = dataset.map(tokenize_function, batched=True)
        dataset = dataset.remove_columns([text_column])
        dataset = dataset.rename_column("label", "labels")
        dataset.set_format("torch")
        
        # Initialize model
        model = AutoModelForSequenceClassification.from_pretrained(
            "distilbert-base-uncased",
            num_labels=len(label_mapping)
        )
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=f"./results_{dataset_name}",
            num_train_epochs=1,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            logging_steps=10,
            save_strategy="no",
            report_to="none"  # Disable wandb/tensorboard
        )
        
        def compute_metrics(eval_pred):
            logits, labels = eval_pred
            preds = np.argmax(logits, axis=1)
            acc = (preds == labels).mean()
            return {"accuracy": acc}
        
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset["train"],
            eval_dataset=dataset["test"],
            compute_metrics=compute_metrics
        )
        
        trainer.train()
        
        # Save model
        model_path = os.path.join(config.MODEL_DIR, f"distilbert_{dataset_name}")
        model.save_pretrained(model_path)
        tokenizer.save_pretrained(model_path)
        
        return {
            "model": "DistilBERT",
            "message": "Training complete",
            "label_mapping": label_mapping
        }

class PhishingInference:
    """Reusable inference utilities for phishing detection"""
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.phishing_model = None
        self.phishing_tokenizer = None
        self.phishing_model_loaded = False
    
    def load_phishing_model(self, model_path: str = "../model/distilbert_phishing_model"):
        """Load the pre-trained phishing detection model"""
        try:
            self.phishing_tokenizer = AutoTokenizer.from_pretrained(model_path, token=config.HF_TOKEN)
            self.phishing_model = AutoModelForSequenceClassification.from_pretrained(model_path)
            self.phishing_model.to(self.device)
            self.phishing_model.eval()
            self.phishing_model_loaded = True
            print("Phishing model loaded successfully")
        except Exception as e:
            print(f"Warning: Could not load phishing model: {e}")
            self.phishing_model_loaded = False
    
    def predict_single_email(self, text: str) -> Dict:
        """Predict if a single email is phishing"""
        if not self.phishing_model_loaded:
            self.load_phishing_model()
        
        # Tokenize
        inputs = self.phishing_tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=config.MAX_LENGTH,
            padding=True
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Predict
        with torch.no_grad():
            outputs = self.phishing_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)
            pred_class = torch.argmax(probs, dim=-1).item()
            confidence = probs[0][pred_class].item()
        
        label = config.PHISHING_ID2LABEL[pred_class]
        explanation = PhishingDetector.generate_explanation(text, label)
        
        return {
            "label": label,
            "confidence": round(confidence, 4),
            "explanation": explanation
        }

# =========================
# INITIALIZE COMPONENTS
# =========================
dataset_manager = DatasetManager()
phishing_detector = PhishingDetector()
model_trainer = ModelTrainer()
inference_engine = PhishingInference()

# Load phishing model at startup
inference_engine.load_phishing_model()

# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Email Detector AI API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# HEALTH & UTILITY ENDPOINTS
# =========================

@app.get("/")
def home():
    return {
        "message": "Email Detector AI API is running",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Check API health",
            "/predict": "Predict phishing email",
            "/datasets/preprocess": "Preprocess dataset",
            "/models/train": "Train a model",
            "/models/list": "List available models"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "phishing_model_loaded": inference_engine.phishing_model_loaded,
        "device": str(inference_engine.device)
    }

# =========================
# DATASET ENDPOINTS
# =========================

@app.post("/datasets/preprocess")
def preprocess_dataset(request: PreprocessRequest):
    """Preprocess a dataset column"""
    try:
        # Load dataset
        df = dataset_manager.load_dataset(request.dataset)
        
        # Validate column
        validation = dataset_manager.validate_columns(df, [request.column])
        if not validation["valid"]:
            return validation
        
        # Preprocess
        df = dataset_manager.preprocess_text_column(df, request.column)
        
        # Save processed dataset
        processed_name = dataset_manager.save_processed_dataset(df, request.dataset)
        
        return {
            "message": "Preprocessed successfully",
            "rows": len(df),
            "processed_file": processed_name,
            "columns": list(df.columns)
        }
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a new dataset file"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Save file
        file_path = os.path.join(config.DATASET_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Preview the dataset
        df = pd.read_csv(file_path, nrows=5)
        
        return {
            "message": "Dataset uploaded successfully",
            "filename": file.filename,
            "preview": df.to_dict(orient="records"),
            "columns": list(df.columns)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# MODEL TRAINING ENDPOINTS
# =========================

@app.post("/models/train", response_model=TrainResponse)
def train_model(request: TrainRequest):
    """Train a model on the specified dataset"""
    print(f"Received training request: {request}")
    try:
        # Load dataset
        df = dataset_manager.load_dataset(request.dataset)
        print(f"Dataset {request.dataset} loaded with {len(df)} rows and columns: {list(df.columns)}")
        
        # Validate columns
        validation = dataset_manager.validate_columns(df, [request.text_column, request.label_column])
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["error"])
        
        # Clean data
        df = df[[request.text_column, request.label_column]].dropna()
        df[request.text_column] = df[request.text_column].astype(str)
        
        X = df[request.text_column]
        y = df[request.label_column]
        print("cleaned")
        
        # Train based on model type
        if request.model == "logistic":
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            result = model_trainer.train_logistic_regression(
                X_train, X_test, y_train, y_test, request.dataset.replace('.csv', '')
            )
            print("trained", result)
            return TrainResponse(**result)
        
        elif request.model == "distilbert":
            result = model_trainer.train_distilbert(
                df, request.text_column, request.label_column, request.dataset.replace('.csv', '')
            )
            return TrainResponse(
                model=result["model"],
                message=result["message"],
                label_mapping=result.get("label_mapping")
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model type: {request.model}")
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/list")
def list_models():
    """List all available trained models"""
    models = []
    
    for file in os.listdir(config.MODEL_DIR):
        if file.endswith('.pkl') or os.path.isdir(os.path.join(config.MODEL_DIR, file)):
            models.append(file)
    
    return {
        "models": models,
        "model_directory": config.MODEL_DIR
    }

# =========================
# PREDICTION ENDPOINTS
# =========================

@app.post("/predict")
def predict_email(request: EmailRequest):
    """Predict if a single email is phishing"""
    try:
        result = inference_engine.predict_single_email(request.email_text)
        
        return {
            "input": request.email_text[:200] + "..." if len(request.email_text) > 200 else request.email_text,
            "prediction": result["label"],
            "confidence": result["confidence"],
            "explanation": result["explanation"]
        }
    
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
def predict_batch(emails: List[EmailRequest]):
    """Predict multiple emails in batch"""
    try:
        results = []
        for email in emails:
            result = inference_engine.predict_single_email(email.email_text)
            results.append({
                "prediction": result["label"],
                "confidence": result["confidence"],
                "explanation": result["explanation"]
            })
        
        return {
            "total": len(emails),
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# ANALYSIS ENDPOINTS
# =========================

@app.post("/analyze/text")
def analyze_text(request: EmailRequest):
    """Analyze email text for phishing indicators without ML model"""
    try:
        indicators = phishing_detector.extract_phishing_indicators(request.email_text)
        
        return {
            "text_length": len(request.email_text),
            "phishing_indicators_found": len(indicators),
            "indicators": indicators,
            "is_suspicious": len(indicators) > 2
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# RUN WITH: uvicorn main:app --reload --port 8000
# =========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)