from fastapi import FastAPI
import pandas as pd
import os
import traceback

app = FastAPI()

DATASET_DIR = "../backend-server/uploads/datasets"
os.makedirs(DATASET_DIR, exist_ok=True)


@app.post("/datasets/preprocess")
def preprocess(data: dict):
    try:
        dataset_name = data.get("dataset")
        column_name = data.get("column")

        # 🔥 validation
        if not dataset_name:
            return {"error": "Dataset name is required"}

        if not column_name:
            return {"error": "Column name is required"}

        # 🔥 dynamic path
        file_path = os.path.join(DATASET_DIR, dataset_name)

        if not os.path.exists(file_path):
            return {"error": f"File not found: {dataset_name}"}

        print(f"Reading dataset: {file_path}")

        # 🔥 robust read
        df = pd.read_csv(
            file_path,
            engine="python",
            on_bad_lines="skip"
        )

        print("Dataset loaded:", df.shape)

        # 🔥 check column exists
        if column_name not in df.columns:
            return {
                "error": f"Column '{column_name}' not found",
                "available_columns": list(df.columns)
            }

        # 🔥 cleaning
        df[column_name] = df[column_name].astype(str).str.lower()

        # 🔥 dynamic processed filename
        processed_filename = f"processed_{dataset_name}"
        processed_path = os.path.join(DATASET_DIR, processed_filename)

        df.to_csv(processed_path, index=False)

        return {
            "message": "Preprocessed successfully",
            "rows": len(df),
            "processed_file": processed_filename
        }

    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        return {"error": str(e)}