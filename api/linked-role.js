import crypto from "crypto";

export default function handler(req, res) {
  const state = crypto.randomUUID();

  const signature = crypto
    .createHmac("sha256", process.env.STATE_SECRET)
    .update(state)
    .digest("hex");

  res.setHeader(
    "Set-Cookie",
    `chuppys_state=${state}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: "https://chuppys.vercel.app/oauth/callback",
    response_type: "code",
    scope: "identify role_connections.write",
    state: state
  });

  res.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
