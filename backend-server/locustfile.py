from locust import HttpUser, task, between, SequentialTaskSet
import random

# ===============================
# TEST DATA
# ===============================

TEST_EMAILS = {
    "phishing": [
        "URGENT: Your PayPal account has been suspended! Verify now: http://fake-paypal.com",
        "Bank Alert: Unusual activity detected. Click here: http://fake-bank.com",
        "CONGRATULATIONS! You've won a $1000 gift card! Claim now",
        "Your Netflix subscription will expire TODAY. Update payment",
        "IRS: You have a tax refund pending. Claim it immediately",
    ],
    "safe": [
        "Hello team, please review the attached Q4 report",
        "Meeting reminder: Sprint planning tomorrow at 10 AM",
        "Your invoice #INV-2024-001 is attached",
        "Weekly standup notes from today's meeting",
        "HR: Please complete your timesheet by Friday",
    ]
}

# ===============================
# USER BEHAVIOR
# ===============================

class SystemTest(SequentialTaskSet):

    def on_start(self):
        """Runs when each simulated user starts"""
        print(f"User {self.user} starting...")

    # ===============================
    # HEALTH / TEST ENDPOINTS
    # ===============================

    @task(1)
    def test_endpoint(self):
        with self.client.get(
            "/api/models/test",
            name="GET /api/models/test",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Test endpoint failed: {response.status_code}")

    # ===============================
    # PREDICTION ENDPOINTS
    # ===============================

    @task(8)
    def predict_phishing(self):
        email = random.choice(TEST_EMAILS["phishing"])

        with self.client.post(
            "/api/models/predict",
            json={"email_text": email},
            name="POST /api/models/predict (Phishing)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Prediction failed: {response.status_code}")

    @task(8)
    def predict_safe(self):
        email = random.choice(TEST_EMAILS["safe"])

        with self.client.post(
            "/api/models/predict",
            json={"email_text": email},
            name="POST /api/models/predict (Safe)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Prediction failed: {response.status_code}")

    @task(2)
    def predict_empty(self):
        with self.client.post(
            "/api/models/predict",
            json={"email_text": ""},
            name="POST /api/models/predict (Empty - Expected 400)",
            catch_response=True
        ) as response:
            if response.status_code == 400:
                response.success()
            else:
                response.failure(f"Expected 400, got {response.status_code}")

    # ===============================
    # DATASET ENDPOINTS
    # ===============================

    @task(2)
    def get_all_datasets(self):
        with self.client.get(
            "/api/datasets/all",
            name="GET /api/datasets/all",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed: {response.status_code}")

    # ===============================
    # MISSING ENDPOINTS
    # ===============================

    @task(1)
    def test_missing_endpoints(self):
        endpoints = ["/api/models", "/api/datasets", "/api/users"]
        endpoint = random.choice(endpoints)

        with self.client.get(
            endpoint,
            name=f"GET {endpoint} (Expected 404)",
            catch_response=True
        ) as response:
            if response.status_code == 404:
                response.success()
            else:
                response.failure(f"Expected 404, got {response.status_code}")


# ===============================
# MAIN USER CLASS
# ===============================

class ExpressUser(HttpUser):
    wait_time = between(1, 3)
    tasks = [SystemTest]
    host = "http://localhost:5000"