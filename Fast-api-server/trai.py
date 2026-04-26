from fastapi import FastAPI
import pandas as pd
import os
import traceback

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, f1_score

import joblib

# 🔥 for transformer models
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
# import torch

app = FastAPI()

DATASET_DIR = "../backend-server/uploads/datasets"
MODEL_DIR = "./models"

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


@app.post("/models/train")
def train(data: dict):
    try:
        dataset_name = data.get("dataset")
        text_column = data.get("text_column")
        label_column = data.get("label_column")
        model_type = data.get("model")  # 🔥 NEW

        if not dataset_name or not text_column or not label_column or not model_type:
            return {"error": "dataset, text_column, label_column, model required"}

        file_path = os.path.join(DATASET_DIR, dataset_name)

        df = pd.read_csv(file_path, engine="python", on_bad_lines="skip")

        if text_column not in df.columns or label_column not in df.columns:
            return {
                "error": "Invalid column names",
                "available_columns": list(df.columns)
            }


        df = df[[text_column, label_column]].dropna()
        df[text_column] = df[text_column].astype(str)

        X = df[text_column]
        y = df[label_column]

        # =========================================
        # 🔥 LOGISTIC REGRESSION
        # =========================================
        if model_type == "logistic":
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            vectorizer = TfidfVectorizer(max_features=5000)
            X_train_vec = vectorizer.fit_transform(X_train)
            X_test_vec = vectorizer.transform(X_test)

            model = LogisticRegression(max_iter=200)
            model.fit(X_train_vec, y_train)

            y_pred = model.predict(X_test_vec)

            acc = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average="weighted")

            # save
            joblib.dump(model, os.path.join(MODEL_DIR, f"model_{dataset_name}.pkl"))
            joblib.dump(vectorizer, os.path.join(MODEL_DIR, f"vectorizer_{dataset_name}.pkl"))

            return {
                "model": "Logistic Regression",
                "accuracy": acc,
                "f1_score": f1
            }

        # =========================================
# 🔥 DISTILBERT (FIXED)
# =========================================
        elif model_type == "distilbert":
            print("Training DistilBERT...")

            # 🔥 CLEAN DATA
            df = df[[text_column, label_column]].dropna()
            df[text_column] = df[text_column].astype(str)

            # 🔥 FIX LABELS (IMPORTANT)
            label_mapping = {label: idx for idx, label in enumerate(df[label_column].unique())}
            df["label"] = df[label_column].map(label_mapping)

            print("Label mapping:", label_mapping)

            # keep only required columns
            df = df[[text_column, "label"]]

            from datasets import Dataset
            dataset = Dataset.from_pandas(df)

            # split
            dataset = dataset.train_test_split(test_size=0.2)

            # 🔥 TOKENIZER
            tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

            def tokenize(example):
                return tokenizer(example[text_column], truncation=True, padding="max_length")

            dataset = dataset.map(tokenize, batched=True)

            # 🔥 REMOVE TEXT COLUMN (CRITICAL FIX)
            dataset = dataset.remove_columns([text_column])

            # 🔥 ENSURE LABEL IS INT
            dataset = dataset.rename_column("label", "labels")

            # 🔥 SET FORMAT FOR TORCH
            dataset.set_format("torch")

            model = AutoModelForSequenceClassification.from_pretrained(
                "distilbert-base-uncased",
                num_labels=len(label_mapping)
            )

            training_args = TrainingArguments(
                output_dir="./results",
                num_train_epochs=1,
                per_device_train_batch_size=8,
                per_device_eval_batch_size=8,
                logging_steps=10,
                save_strategy="no"
            )

            import numpy as np

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

            # save model + tokenizer
            model.save_pretrained(f"{MODEL_DIR}/distilbert_{dataset_name}")
            tokenizer.save_pretrained(f"{MODEL_DIR}/distilbert_{dataset_name}")

            return {
                "model": "DistilBERT",
                "message": "Training complete",
                "label_mapping": label_mapping
            }

        # =========================================
        # 🔥 BERT (optional)
        # =========================================
        elif model_type == "bert":
            return {"message": "BERT training not implemented yet"}

        else:
            return {"error": "Invalid model type"}

    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        return {"error": str(e)}