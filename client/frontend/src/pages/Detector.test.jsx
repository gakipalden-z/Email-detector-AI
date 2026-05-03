// src/pages/Detector.test.jsx

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, test, beforeEach, expect, vi } from "vitest";
import Detector from "./Detector";

// 🔥 Mock Shell
vi.mock("@/components/Shell", () => ({
  Shell: ({ children }) => <div>{children}</div>
}));

// 🔥 Mock EmailForm
vi.mock("@/components/EmailForm", () => ({
  EmailForm: () => <div>Email Form Component</div>
}));

// 🔥 Mock 2FA setup
vi.mock("@/components/TwoFactorSetup", () => ({
  default: () => <div>2FA Setup Component</div>
}));

describe("Detector Page", () => {

  beforeEach(() => {
    document.title = "";
  });

  // ============================
  // 🔹 RENDER PAGE
  // ============================

  test("should render main content", () => {
    render(<Detector />);

    expect(
      screen.getByText(/Is this email/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/trying to deceive/i)
    ).toBeInTheDocument();
  });

  // ============================
  // 🔹 COMPONENTS RENDER
  // ============================

  test("should render EmailForm and 2FA components", () => {
    render(<Detector />);

    expect(screen.getByText("Email Form Component")).toBeInTheDocument();
    expect(screen.getByText("2FA Setup Component")).toBeInTheDocument();
  });

  // ============================
  // 🔹 TITLE SET
  // ============================

  test("should set document title", () => {
    render(<Detector />);

    expect(document.title).toBe(
      "PhishLens — AI-powered phishing detection"
    );
  });

  // ============================
  // 🔹 MODEL STATUS TEXT
  // ============================

  test("should display model status", () => {
    render(<Detector />);

    expect(
      screen.getByText(/Model online/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/DistilBERT/i)
    ).toBeInTheDocument();
  });

});