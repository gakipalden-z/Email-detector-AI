import { useState } from "react";
import toast from "react-hot-toast";

export default function TwoFactorSetup() {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [qr, setQr] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
const [enabled, setEnabled] = useState(
  storedUser?.twoFactorEnabled || false
);  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // ================= SETUP =================
  const setup2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/2fa/setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setQr(data.qr);
      toast.success("Scan QR code");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY =================
  const verify2FA = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: otp }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setEnabled(true);
      setQr(null);
      setOtp("");

      toast.success("2FA Enabled ✅");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="font-semibold text-lg">
        Two-Factor Authentication
      </h2>

      <p className="text-sm text-muted-foreground mt-1">
        Add an extra layer of security to your account.
      </p>

      {/* NOT ENABLED */}
      {!enabled && !qr && (
        <button
          onClick={setup2FA}
          disabled={loading}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
        >
          {loading ? "Generating..." : "Enable 2FA"}
        </button>
      )}

      {/* QR DISPLAY */}
      {qr && (
        <div className="mt-4">
          <img src={qr} alt="QR Code" className="mx-auto mb-3" />

          <input
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
            maxLength={6}
            placeholder="Enter 6-digit code"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <button
            onClick={verify2FA}
            disabled={loading}
            className="mt-3 w-full rounded-md bg-black text-white py-2"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
        </div>
      )}

      {/* ENABLED */}
      {enabled && (
        <div className="mt-4 text-green-600 text-sm">
          ✅ 2FA is enabled on your account
        </div>
      )}
    </div>
  );
}