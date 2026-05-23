export function welcomeEmailHtml(firstName: string): string {
  const name = firstName || 'there'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Agent7even</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0efe9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 48px auto; background: #0d0d0d; border-radius: 16px; overflow: hidden; }
    .header { background: #0d0d0d; padding: 40px 48px 32px; border-bottom: 1px solid #1f1f1f; }
    .logo { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c8522a; }
    .body { padding: 48px; }
    .greeting { font-size: 28px; font-weight: 600; color: #f5f4f0; line-height: 1.25; margin-bottom: 20px; }
    .intro { font-size: 16px; color: #999; line-height: 1.7; margin-bottom: 40px; }
    .steps-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #c8522a; margin-bottom: 20px; }
    .step { display: flex; gap: 20px; margin-bottom: 28px; }
    .step-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #1a1a1a; border: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #c8522a; }
    .step-content { padding-top: 4px; }
    .step-title { font-size: 15px; font-weight: 600; color: #f5f4f0; margin-bottom: 4px; }
    .step-desc { font-size: 14px; color: #666; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #1f1f1f; margin: 40px 0; }
    .cta-wrap { text-align: center; margin-bottom: 40px; }
    .cta { display: inline-block; background: #c8522a; color: #f5f4f0; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 36px; border-radius: 8px; letter-spacing: 0.02em; }
    .footer { padding: 32px 48px; border-top: 1px solid #1f1f1f; }
    .footer-text { font-size: 13px; color: #444; line-height: 1.7; }
    .footer-text a { color: #c8522a; text-decoration: none; }
    .footer-sig { font-size: 14px; color: #666; margin-top: 24px; }
    .footer-sig strong { color: #999; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Agent7even</div>
    </div>

    <div class="body">
      <h1 class="greeting">Welcome, ${name}.</h1>
      <p class="intro">
        Your account is set up and you're officially part of the Agent7even client portal.
        Here's everything you can expect in the weeks ahead.
      </p>

      <p class="steps-label">What happens next</p>

      <div class="step">
        <div class="step-num">1</div>
        <div class="step-content">
          <p class="step-title">Complete your onboarding</p>
          <p class="step-desc">Tell us about your business, goals, and what you're working toward. This helps us tailor everything to you.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">2</div>
        <div class="step-content">
          <p class="step-title">Choose your plan</p>
          <p class="step-desc">Select the engagement level that fits your business — from AI Sprint to full Done-For-You marketing support.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">3</div>
        <div class="step-content">
          <p class="step-title">Request your first service</p>
          <p class="step-desc">Browse our service catalogue and submit your first project brief. We'll be in touch to kick things off.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">4</div>
        <div class="step-content">
          <p class="step-title">Use the AI Toolkit</p>
          <p class="step-desc">Access our library of done-for-you AI prompts for captions, emails, ad copy, and more — available anytime from your dashboard.</p>
        </div>
      </div>

      <hr class="divider" />

      <div class="cta-wrap">
        <a href="https://app.agent7even.com/dashboard" class="cta">Go to your dashboard →</a>
      </div>
    </div>

    <div class="footer">
      <p class="footer-text">
        Questions? Reply to this email or reach us at
        <a href="mailto:hello@agent7even.com">hello@agent7even.com</a>.
        We typically respond within one business day.
      </p>
      <p class="footer-sig">
        <strong>The Agent7even Team</strong><br />
        <a href="https://app.agent7even.com" style="color: #444; text-decoration: none;">app.agent7even.com</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function welcomeEmailText(firstName: string): string {
  const name = firstName || 'there'
  return `Welcome, ${name}.

Your Agent7even account is ready.

Here's what to do next:

1. Complete your onboarding — tell us about your business and goals.
2. Choose your plan — AI Sprint, Growth, or Done-For-You.
3. Request your first service — submit a project brief and we'll take it from there.
4. Use the AI Toolkit — prompts for captions, emails, ad copy, and more.

Go to your dashboard:
https://app.agent7even.com/dashboard

Questions? Reply to this email or reach us at hello@agent7even.com.

— The Agent7even Team
`
}
