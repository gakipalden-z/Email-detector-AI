// src/pages/Login.test.jsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, test, beforeEach, expect, vi } from "vitest";
import Login from "./Login";

// 🔥 Mock Shell
vi.mock("@/components/Shell", () => ({
  Shell: ({ children }) => <div>{children}</div>
}));

// 🔥 Mock react-router
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <span>{children}</span>
  };
});

// 🔥 Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// 🔥 Mock fetch
global.fetch = vi.fn();

describe("Login Page", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ============================
  // 🔹 RENDER
  // ============================

  test("should render login form", () => {
    render(<Login />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@domain.com")).toBeInTheDocument();
  });

  // ============================
  // 🔹 LOGIN SUCCESS
  // ============================

  test("should login successfully and redirect", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "fake-token",
        user: { role: "admin" }
      })
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "admin@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" }
    });

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  // ============================
  // 🔹 LOGIN ERROR
  // ============================

  test("should show error on failed login", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invalid credentials" })
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "wrong@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong" }
    });

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  // ============================
  // 🔹 2FA REQUIRED
  // ============================

  test("should switch to 2FA screen when required", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        requires2FA: true,
        userId: "123"
      })
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "user@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" }
    });

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
    });
  });

  // ============================
  // 🔹 VERIFY 2FA
  // ============================

  test("should verify 2FA and login", async () => {
    // first call → login requires 2FA
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requires2FA: true,
          userId: "123"
        })
      })
      // second call → 2FA success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "fake-token",
          user: { role: "user" }
        })
      });

    render(<Login />);

    // login first
    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "user@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" }
    });

    fireEvent.click(screen.getByText("Sign in"));

    // wait for 2FA screen
    await waitFor(() => {
      expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("123456"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Verify 2FA"));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});