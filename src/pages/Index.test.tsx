import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "./Index";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("Index page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.grecaptcha;
    global.fetch = vi.fn();
  });

  it("renders the landing content and contact form", () => {
    render(<Index />);

    expect(
      screen.getByRole("heading", {
        name: /servicios geotécnicos profesionales para obras seguras/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /navegación principal/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^servicios geotécnicos$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /galería de imágenes/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /formulario de contacto/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje/i)).toBeInTheDocument();
  });

  it("scrolls to anchored sections from hero calls to action", () => {
    render(<Index />);

    fireEvent.click(screen.getByRole("button", { name: /ver servicios/i }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("tracks hero pointer position for the interactive background", () => {
    render(<Index />);
    const hero = screen.getByRole("heading", {
      name: /servicios geotécnicos profesionales para obras seguras/i,
    }).closest("section") as HTMLElement;
    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      right: 410,
      bottom: 320,
      width: 400,
      height: 300,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(hero, { clientX: 110, clientY: 170 });

    expect(hero.style.getPropertyValue("--px")).toBe("100px");
    expect(hero.style.getPropertyValue("--py")).toBe("150px");
  });

  it("ignores hero pointer movement when reduced motion is preferred", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    render(<Index />);
    const hero = screen.getByRole("heading", {
      name: /servicios geotécnicos profesionales para obras seguras/i,
    }).closest("section") as HTMLElement;

    fireEvent.mouseMove(hero, { clientX: 110, clientY: 170 });

    expect(hero.style.getPropertyValue("--px")).toBe("");
  });

  it("shows validation feedback and does not call the API for invalid form data", async () => {
    render(<Index />);

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "persona@example.com" } });
    fireEvent.change(screen.getByLabelText(/mensaje/i), { target: { value: "corto" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Datos inválidos",
        })
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("stops submission when reCAPTCHA cannot provide a token", async () => {
    window.grecaptcha = {
      execute: vi.fn().mockResolvedValue(""),
    };
    render(<Index />);

    fillValidContactForm();
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error de verificación",
        description: "No se pudo verificar reCAPTCHA.",
      });
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("stops submission when reCAPTCHA execution throws", async () => {
    window.grecaptcha = {
      execute: vi.fn().mockRejectedValue(new Error("captcha unavailable")),
    };
    render(<Index />);

    fillValidContactForm();
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error de verificación",
        description: "No se pudo verificar reCAPTCHA.",
      });
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts valid contact requests and resets the form on success", async () => {
    window.grecaptcha = {
      execute: vi.fn().mockResolvedValue("token-123"),
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<Index />);

    fillValidContactForm();
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: "Laura Gómez",
            email: "laura@example.com",
            empresa: "GeoLab",
            mensaje: "Necesito un estudio geotécnico para una vivienda.",
            token: "token-123",
          }),
        })
      );
    });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Gracias por tu interés",
      })
    );
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("");
  });

  it("shows API errors without clearing the form", async () => {
    window.grecaptcha = {
      execute: vi.fn().mockResolvedValue("token-123"),
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No se pudieron enviar los correos" }),
    });
    render(<Index />);

    fillValidContactForm();
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error al enviar",
        description: "No se pudieron enviar los correos",
      });
    });
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Laura Gómez");
  });

  it("silently drops honeypot submissions", async () => {
    render(<Index />);

    fillValidContactForm();
    fireEvent.change(document.querySelector("input[name='website']") as HTMLInputElement, {
      target: { value: "spam-site" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toHaveValue("");
    });
    expect(toast).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

function fillValidContactForm() {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Laura Gómez" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "laura@example.com" } });
  fireEvent.change(screen.getByLabelText(/empresa/i), { target: { value: "GeoLab" } });
  fireEvent.change(screen.getByLabelText(/mensaje/i), {
    target: { value: "Necesito un estudio geotécnico para una vivienda." },
  });
}
