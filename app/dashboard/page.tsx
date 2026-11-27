"use client";

import { FormEvent, useEffect, useState } from "react";

type FormState = {
  phoneE164: string;
  displayName: string;
  templateName: string;
  languageCode: string;
  scheduledAt: string;
  consentSource: string;
  consentConfirmed: boolean;
};

const localDateTimeMin = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

const initialForm: FormState = {
  phoneE164: "",
  displayName: "",
  templateName: "",
  languageCode: "en",
  scheduledAt: "",
  consentSource: "",
  consentConfirmed: false
};

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminKey, setAdminKey] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setMessage("Could not verify login state. Refresh the page."))
      .finally(() => setChecking(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      setAuthenticated(true);
      setAdminKey("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not schedule message");
      setMessage("Message scheduled. Queue ID: " + data.message.id);
      setForm(initialForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not schedule message");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
    setMessage("You are logged out.");
  }

  if (checking) return <main className="dashboard"><p>Checking session…</p></main>;

  if (!authenticated) {
    return <main className="dashboard">
      <a href="/" className="backlink">← Home</a>
      <section className="panel">
        <span className="eyebrow">ADMIN ACCESS</span>
        <h1>Sign in</h1>
        <p>Use the admin key configured in your Netlify environment variables.</p>
        <form onSubmit={login} className="form">
          <label>Admin key<input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} required autoComplete="current-password" /></label>
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        {message && <p className="notice">{message}</p>}
      </section>
    </main>;
  }

  return <main className="dashboard">
    <header className="dashhead">
      <div><span className="eyebrow">CLOUD WHATSAPP AUTOMATION</span><h1>Schedule a message</h1></div>
      <button className="secondary" onClick={logout}>Log out</button>
    </header>
    <section className="panel">
      <p className="muted">This dashboard sends only approved WhatsApp templates to contacts whose opt-in is recorded. Use international phone format, for example +919876543210.</p>
      <form onSubmit={schedule} className="form">
        <label>Phone number (E.164)<input value={form.phoneE164} onChange={(e) => setForm({...form, phoneE164:e.target.value})} placeholder="+919876543210" required /></label>
        <label>Contact name (optional)<input value={form.displayName} onChange={(e) => setForm({...form, displayName:e.target.value})} placeholder="Customer name" /></label>
        <div className="two">
          <label>Approved template name<input value={form.templateName} onChange={(e) => setForm({...form, templateName:e.target.value})} placeholder="service_update" pattern="[a-z0-9_]{2,128}" required /></label>
          <label>Template language<input value={form.languageCode} onChange={(e) => setForm({...form, languageCode:e.target.value})} placeholder="en" required /></label>
        </div>
        <label>Schedule date and time (your local timezone)<input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({...form, scheduledAt:e.target.value})} min={localDateTimeMin()} required /></label>
        <label>How was consent obtained?<input value={form.consentSource} onChange={(e) => setForm({...form, consentSource:e.target.value})} placeholder="Website signup form, date, etc." required /></label>
        <label className="consent"><input type="checkbox" checked={form.consentConfirmed} onChange={(e) => setForm({...form, consentConfirmed:e.target.checked})} required /> I confirm this person explicitly opted in to receive WhatsApp messages.</label>
        <button disabled={busy}>{busy ? "Scheduling…" : "Schedule message"}</button>
      </form>
      {message && <p className="notice">{message}</p>}
      <p className="warning">Outbound delivery remains disabled until WHATSAPP_SENDING_ENABLED is set to true in Netlify. Keep it false while testing.</p>
    </section>
  </main>;
}
