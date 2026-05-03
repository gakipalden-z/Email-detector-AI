// src/App.test.jsx

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, test, beforeEach, expect, vi } from "vitest";
import App from "./App";

// 🔥 Mock all pages correctly (Vitest requires default)
vi.mock("@/pages/Login", () => ({
  default: () => <div>Login Page</div>
}));

vi.mock("@/pages/Register", () => ({
  default: () => <div>Register Page</div>
}));

vi.mock("@/pages/Detector", () => ({
  default: () => <div>Detector Page</div>
}));

vi.mock("@/pages/Researcher", () => ({
  default: () => <div>Researcher Page</div>
}));

vi.mock("@/pages/Admin", () => ({
  default: () => <div>Admin Page</div>
}));

vi.mock("@/pages/NotFound", () => ({
  default: () => <div>Not Found Page</div>
}));

describe("App Routing", () => {

  beforeEach(() => {
    localStorage.clear();
  });

  // ============================
  // 🔓 PUBLIC ROUTES
  // ============================

  test("should show login page when not authenticated", () => {
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("should redirect to login if accessing protected route without token", () => {
    window.history.pushState({}, "", "/detector");

    render(<App />);

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  // ============================
  // 🔐 ROOT REDIRECT
  // ============================

  test("should redirect admin to admin page", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  test("should redirect researcher to researcher page", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "researcher" }));

    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByText("Researcher Page")).toBeInTheDocument();
  });

  test("should show detector for normal user", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "user" }));

    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByText("Detector Page")).toBeInTheDocument();
  });

  // ============================
  // 🔐 ROLE PROTECTION
  // ============================

  test("should block user from accessing admin route", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "user" }));

    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(screen.getByText("Detector Page")).toBeInTheDocument();
  });

  test("should allow admin to access admin route", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  test("should allow researcher to access researcher route", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "researcher" }));

    window.history.pushState({}, "", "/researcher");

    render(<App />);

    expect(screen.getByText("Researcher Page")).toBeInTheDocument();
  });

  // ============================
  // ❌ NOT FOUND
  // ============================

  test("should show not found page", () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    expect(screen.getByText("Not Found Page")).toBeInTheDocument();
  });

});