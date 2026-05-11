from locust import HttpUser, task, between
import random

TEST_EMAILS = [
    "URGENT: Your account has been compromised! Click here: http://fake.com",
    "Hello, please review the attached document for our meeting",
    "Your PayPal account is suspended. Verify now: http://fake-paypal.com",
    "Team meeting tomorrow at 10 AM in Conference Room B",
    "CONGRATULATIONS! You've won a $1000 gift card! Claim now",
    "Your invoice #INV-123 is ready for payment",
]

class SimpleFastAPITest(HttpUser):
    wait_time = between(1, 2)
    host = "http://localhost:8000"
    
    @task(1)
    def health(self):
        self.client.get("/health")
    
    @task(1)
    def home(self):
        self.client.get("/")
    
    @task(8)  # Most frequent
    def predict(self):
        self.client.post("/predict", json={
            "email_text": random.choice(TEST_EMAILS)
        })
    
    @task(2)
    def analyze(self):
        self.client.post("/analyze/text", json={
            "email_text": "URGENT: Please verify your account"
        })
    
    @task(1)
    def empty_email(self):
        self.client.post("/predict", json={"email_text": ""})