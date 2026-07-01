const VERIFY_URLS = {
  recaptcha_v2: "https://www.google.com/recaptcha/api/siteverify",
  recaptcha_v3: "https://www.google.com/recaptcha/api/siteverify",
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify"
};

async function callVerifyEndpoint(url, secretKey, token, remoteIp) {
  const params = new URLSearchParams();
  params.set("secret", secretKey || "");
  params.set("response", token);
  if (remoteIp) params.set("remoteip", remoteIp);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Verification endpoint responded with ${response.status}`);
  return response.json();
}

async function verifyCaptcha(security, token, remoteIp) {
  const provider = security?.captchaProvider || "none";
  if (provider === "none") return { ok: true };

  if (!token) {
    return { ok: false, code: "captcha_required", error: "Please complete the captcha." };
  }

  const url = VERIFY_URLS[provider];
  if (!url) return { ok: true };

  let data;
  try {
    data = await callVerifyEndpoint(url, security.secretKey, token, remoteIp);
  } catch (error) {
    return { ok: false, code: "captcha_unavailable", error: "Could not reach the captcha verification service." };
  }

  if (!data.success) {
    return { ok: false, code: "captcha_failed", error: "Captcha verification failed." };
  }

  if (provider === "recaptcha_v3") {
    const minScore = Number(security.recaptchaMinScore);
    const threshold = Number.isFinite(minScore) ? minScore : 0.5;
    if (typeof data.score === "number" && data.score < threshold) {
      return { ok: false, code: "captcha_failed", error: "Captcha verification failed." };
    }
  }

  return { ok: true };
}

module.exports = { verifyCaptcha };
