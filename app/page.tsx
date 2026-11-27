export default function Home() {
  return <main className="shell">
    <section className="hero">
      <span className="eyebrow">CLOUD NOTIFICATION PLATFORM</span>
      <h1>WhatsApp automation,<br /><em>running online.</em></h1>
      <p className="intro">Schedule customer and service notifications from the cloud. This starter is in safe mode until credentials, approved templates, and recipient consent are configured.</p>
      <div className="status"><span className="dot" /> Outbound sending disabled by default</div>
    </section>
    <section className="grid">
      <article><span>01 / CONTACTS</span><h2>Consent first</h2><p>Only explicitly opted-in contacts can receive messages. Opt-outs are suppressed.</p></article>
      <article><span>02 / SCHEDULING</span><h2>Runs in the cloud</h2><p>Netlify scheduled functions run while your laptop is off.</p></article>
      <article><span>03 / DELIVERY</span><h2>Official API</h2><p>Uses approved WhatsApp Business templates. API acceptance is not proof of delivery.</p></article>
    </section>
    <footer>Configure Neon, Netlify environment variables, and Meta WhatsApp Cloud API to continue.</footer>
  </main>;
}
