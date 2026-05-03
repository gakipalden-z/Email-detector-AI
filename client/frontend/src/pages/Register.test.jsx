// src/pages/Register.test.jsx

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, test, beforeEach, expect, vi } from "vitest";
import Register from "./Register";

// 🔥 Mock Shell
vi.mock("@/components/Shell", () => ({
  Shell: ({ children }) => <div>{children}</div>
}));

// 🔥 Mock router
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

describe("Register Page", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================
  // 🔹 RENDER
  // ============================

  test("should render form", () => {
    render(<Register />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@domain.com")).toBeInTheDocument();
  });

  // ============================
  // 🔹 PASSWORD VALIDATION
  // ============================

  test("should block short password", async () => {
    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "test@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "123" }
    });

    fireEvent.click(screen.getByText("Create account"));

    // ❌ should NOT call API
    expect(fetch).not.toHaveBeenCalled();
  });

  // ============================
  // 🔹 SUCCESS REGISTER
  // ============================

  test("should register successfully and redirect", async () => {
    vi.useFakeTimers();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "success" })
    });

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
      target: { value: "test@test.com" }
    });

    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Create account"));

    // wait for fetch
    await screen.findByText("Create account");

    // simulate delay
    vi.runAllTimers();

    expect(fetch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  // ============================
  // 🔹 ERROR CASE
  // ============================
test("should show error if registration fails", async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Email already exists" })
  });

  render(<Register />);

  fireEvent.change(screen.getByPlaceholderText("you@domain.com"), {
    target: { value: "test@test.com" }
  });

  fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
    target: { value: "123456" }
  });

  fireEvent.click(screen.getByText("Create account"));

  // 🔥 CRITICAL — flush pending timers
  vi.runAllTimers();

  // 🔥 NOW check error
  expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
});
  // ============================
  // 🔹 ROLE SELECTION
  // ============================

  test("should change role when clicked", () => {
    render(<Register />);

    const researcherBtn = screen.getByText("researcher");

    fireEvent.click(researcherBtn);

    expect(researcherBtn).toBeInTheDocument();
  });

});