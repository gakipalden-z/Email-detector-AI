import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText } from "lucide-react";

interface EmailInputProps {
  onAnalyze: (text: string) => void;
}

const SAMPLE_PHISHING = `Dear Valued Customer,

We have detected unusual activity on your account. Your account will be SUSPENDED within 24 hours unless you verify your identity immediately!

Click here to verify your account: http://secure-banklogin.suspicious-site.com/verify

Please provide your password and social security number to complete verification.

Act now to avoid losing access to your account!

Sincerely,
Customer Support Team`;

const SAMPLE_SAFE = `Hi Sarah,

Hope you're doing well! Just wanted to follow up on our meeting from last Thursday about the Q3 marketing budget.

I've attached the revised spreadsheet with the updated numbers we discussed. Let me know if you have any questions or if you'd like to schedule another call this week.

Best regards,
Tom`;

const EmailInput = ({ onAnalyze }: EmailInputProps) => {
  const [emailText, setEmailText] = useState("");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-1">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">EMAIL_CONTENT.txt</span>
        </div>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste the email content here for analysis..."
          className="w-full min-h-[240px] bg-transparent p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => emailText.trim() && onAnalyze(emailText)}
          disabled={!emailText.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-shadow hover:border-glow"
        >
          <Search className="w-4 h-4" />
          Run Analysis
        </motion.button>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">Load sample:</span>
        <button
          onClick={() => setEmailText(SAMPLE_PHISHING)}
          className="font-mono text-xs text-destructive hover:underline"
        >
          Phishing
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={() => setEmailText(SAMPLE_SAFE)}
          className="font-mono text-xs text-primary hover:underline"
        >
          Legitimate
        </button>
      </div>
    </div>
  );
};

export default EmailInput;
