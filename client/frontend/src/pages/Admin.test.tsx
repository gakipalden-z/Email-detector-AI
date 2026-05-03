// src/pages/Admin.test.jsx

import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, test, beforeEach, expect, vi } from "vitest";
import Admin from "./Admin";

// 🔥 Mock layout
vi.mock("@/components/Shell", () => ({
  Shell: ({ children }) => <div>{children}</div>
}));

// 🔥 Mock 2FA component
vi.mock("@/components/TwoFactorSetup", () => ({
  default: () => <div>2FA Setup Component</div>
}));

// 🔥 Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// 🔥 Mock fetch
global.fetch = vi.fn();

describe("Admin Page", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsers = [
    {
      _id: "1",
      email: "admin@test.com",
      role: "admin",
      status: "accepted",
      twoFactorEnabled: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: "2",
      email: "user@test.com",
      role: "user",
      status: "pending",
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    }
  ];

  // ============================
  // 🔹 LOAD USERS
  // ============================

  test("should fetch and display users", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0);
      expect(screen.getAllByText("user@test.com").length).toBeGreaterThan(0);
    });
  });

  // ============================
  // 🔹 STATS
  // ============================

  test("should display stats", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText("Total users")).toBeInTheDocument();
      expect(screen.getByText("Pending approval")).toBeInTheDocument();
    });
  });

  // ============================
  // 🔹 ROLE UPDATE
  // ============================

  test("should update user role", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      })
      .mockResolvedValueOnce({ ok: true });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], { target: { value: "researcher" } });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/role/"),
      expect.any(Object)
    );
  });

  // ============================
  // 🔹 APPROVE USER
  // ============================

  test("should approve user", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      })
      .mockResolvedValueOnce({ ok: true });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getAllByText("user@test.com").length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[0]);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/status/"),
      expect.any(Object)
    );
  });

  // ============================
  // 🔹 DELETE USER
  // ============================

  test("should delete user", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      })
      .mockResolvedValueOnce({ ok: true });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getAllByText("user@test.com").length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByLabelText("Delete");

    fireEvent.click(deleteButtons[0]);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/delete/"),
      expect.any(Object)
    );
  });

  // ============================
  // 🔹 2FA STATUS
  // ============================

  test("should display 2FA status correctly", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText("2FA Enabled")).toBeInTheDocument();
      expect(screen.getByText("2FA Disabled")).toBeInTheDocument();
    });
  });

});