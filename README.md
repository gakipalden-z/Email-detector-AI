# Phishing Email Detector using Large Language Models (LLM)

## Project Overview

Phishing attacks are one of the most common cybersecurity threats that exploit human trust to steal sensitive information such as login credentials, financial details, and personal data. Traditional phishing detection techniques such as blacklists and rule-based filters often fail to detect new or sophisticated phishing attacks.

This project aims to develop a phishing email detection system using Large Language Models (LLMs) such as BERT and DistilBERT to analyze the semantic and contextual features of emails. The system will classify emails as **Phishing** or **Legitimate** using machine learning and natural language processing techniques.

---

## Objectives

The main objectives of this project are:

- To collect and preprocess phishing and legitimate email datasets.
- To train and fine-tune a transformer-based LLM model for phishing detection.
- To develop a backend API for model inference.
- To create a simple web interface for testing email classification.
- To evaluate the model using performance metrics such as Accuracy, Precision, Recall, and F1-score.

---

## Technologies Used

### Programming Languages
- Python
- JavaScript & typescript

### Frameworks and Libraries
- Flask (Backend API)
- React (Frontend)
- HuggingFace Transformers
- PyTorch
- Scikit-learn
- Pandas
- NumPy

### Tools
- Git & GitHub
- Visual Studio Code
- MongoDB Atlas
- Google Colab (for model training)

---

## Project Structure

```text
phishing-email-detector-llm
│
├── client/                 # Frontend (React application)
│
├── server/                 # Backend API
│   ├── app.py
│   └── routes/
│
├── model/                  # Machine learning model
│   ├── train.py
│   ├── predict.py
│   └── model.pkl
│
├── dataset/                # Email datasets
│
├── docs/                   # Project documentation
│
|
├── server                  #APi and server logic
|
|
├── README.md
└── .gitignore
````

---

## Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/gakipalden-z/phishing-email-detector-llm.git
cd phishing-email-detector-llm
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Node Dependencies

```bash
cd client
npm install
```

### 4. Start Backend Server

```bash
cd server
python app.py
```

### 5. Start Frontend

```bash
cd client
npm start
```

---

## Dataset

The datasets used in this project include:

* **Enron Email Dataset** – Legitimate emails
* **Nazario Phishing Corpus** – Phishing emails
* **PhishTank Dataset**
* **Kaggle Phishing Email Dataset**

These datasets provide a balanced set of phishing and legitimate email samples for model training and evaluation.

---

## System Workflow

1. User inputs or uploads an email.
2. Email text is preprocessed and tokenized.
3. The LLM model analyzes the semantic and contextual features.
4. The system classifies the email as **Phishing** or **Legitimate**.
5. The result is displayed with a confidence score.

---

## Performance Metrics

| Metric    | Description                              |
| --------- | ---------------------------------------- |
| Accuracy  | Overall prediction accuracy              |
| Precision | Correct phishing detections              |
| Recall    | Ability to detect actual phishing emails |
| F1 Score  | Balance between precision and recall     |
| ROC-AUC   | Model classification performance         |

---

## Expected Outcome

The final system will provide:

* A trained phishing detection model
* A working API for prediction
* A simple web interface for testing
* Evaluation reports and performance metrics

---

## Team Members

| Name           | Student ID |
| -------------- | ---------- |
| Tashi Namgay   |            |
| Gaki Palden    |            |
| Melam Rabzang  |            |
| Tandin Wangyel |            |

---

## Future Improvements

* Integration with enterprise email systems
* Real-time email monitoring
* Explainable AI for highlighting suspicious text
* Support for SMS and social media phishing detection

---

## License

This project is developed for academic purposes as part of the Cyber Security Project course.

```
```
