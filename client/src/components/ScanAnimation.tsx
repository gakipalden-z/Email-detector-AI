import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const steps = [
  "Initializing NLP tokenizer...",
  "Tokenizing email content...",
  "Running DistilBERT inference...",
  "Computing logits & probabilities...",
  "Generating threat assessment...",
];

const ScanAnimation = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <Loader2 className="w-12 h-12 text-primary mx-auto mb-6 animate-spin" />
      <h2 className="font-mono text-lg text-primary text-glow mb-6">ANALYZING EMAIL</h2>
      <div className="space-y-2 max-w-sm mx-auto text-left">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.4, duration: 0.3 }}
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.4 + 0.3 }}
              className="text-primary"
            >
              ✓
            </motion.span>
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScanAnimation;
