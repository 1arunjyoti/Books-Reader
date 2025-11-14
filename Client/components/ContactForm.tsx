"use client";

import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_FALLBACK = 2000; // limit mailto fallback body length

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  function validateInputs() {
    if (honeypot.trim() !== "") {
      // obvious bot — fail silently
      return { valid: false, reason: "bot" } as const;
    }

    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, reason: "Please enter a valid email address." } as const;
    }

    if (message.trim().length < 10) {
      return { valid: false, reason: "Message is too short (min 10 characters)." } as const;
    }

    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      return { valid: false, reason: "One of the fields is too long." } as const;
    }

    return { valid: true } as const;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateInputs();
    if (!validation.valid) {
      if (validation.reason === "bot") {
        // don't inform bots — simply reset state silently
        setStatus("idle");
        return;
      }
      setErrorMessage(validation.reason);
      setStatus("error");
      return;
    }

    setStatus("sending");

    // Instead of sending via server, open the user's mail client directly with a mailto: link.
    const subject = encodeURIComponent(`BooksReader contact from ${name || email || "user"}`);
    let bodyText = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    if (bodyText.length > MAX_MESSAGE_FALLBACK) {
      bodyText = bodyText.slice(0, MAX_MESSAGE_FALLBACK) + "\n\n[message truncated]";
    }
    const body = encodeURIComponent(bodyText);

    try {
      window.location.href = `mailto:hello@booksreader.example?subject=${subject}&body=${body}`;
      setStatus("success");
      // Reset form fields (best effort; navigation may interrupt this)
      setName("");
      setEmail("");
      setMessage("");
      setHoneypot("");
    } catch {
      setStatus("error");
      setErrorMessage("Could not open your mail client. Please contact hello@booksreader.example.");
    }
  }

  async function copyMessageToClipboard() {
    setCopyStatus("idle");

    const bodyText = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bodyText);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = bodyText;
        // Prevent scrolling to bottom
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopyStatus("copied");
      // small visual reset after 2s
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Contact form">
      {/* Honeypot field to deter naive bots (visually hidden and excluded from keyboard) */}
      <input
        aria-hidden="true"
        tabIndex={-1}
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: "absolute", left: "-9999px", top: "auto" }}
      />

      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name (optional)</label>
        <input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          placeholder="Your name"
          type="text"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input
          id="contact-email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          placeholder="you@example.com"
          type="email"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
        <textarea
          id="contact-message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 min-h-[120px]"
          placeholder="How can we help?"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send message"}
        </button>

        <div aria-live="polite" role="status" className="min-w-[200px]">
          {status === "success" && <p className="text-sm text-green-600 dark:text-green-400">Message sent. We will reply soon.</p>}
          {status === "error" && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage || "Could not open your mail client."}</p>
              <button
                type="button"
                onClick={copyMessageToClipboard}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white/90 dark:bg-gray-700/90 px-2 py-1 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100"
              >
                {copyStatus === "copied" ? "Copied" : "Copy message"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
