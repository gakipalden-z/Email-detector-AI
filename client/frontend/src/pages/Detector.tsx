import { Shell } from "@/components/Shell";
import { EmailForm } from "@/components/EmailForm";
import { useEffect } from "react";
import TwoFactorSetup from "@/components/TwoFactorSetup";

export default function Detector() {
  useEffect(() => {
    document.title = "PhishLens — AI-powered phishing detection";
  }, []);

  return (
    <Shell>
      <section className="mb-10 max-w-3xl animate-[var(--animate-fade-up)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Model online · DistilBERT v2.1
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Is this email <span className="italic text-muted-foreground">trying to deceive</span> you?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Paste an email below. PhishLens analyzes language, structure, and links — then explains exactly why it flagged or cleared the message.
        </p>
      </section>
      <EmailForm />
      <TwoFactorSetup />
    </Shell>
  );
}
