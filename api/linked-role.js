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

  const discordURL =
    "https://discord.com/oauth2/authorize?" +
    new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      redirect_uri: "https://chuppys.vercel.app/oauth/callback",
      response_type: "code",
      scope: "identify role_connections.write",
      state: state
    }).toString();

  res.setHeader("Content-Type", "text/html; charset=UTF-8");

  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chuppys Verification</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: #100d1c;
      color: #eeeafa;
      font-family: Arial, Helvetica, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 430px;
    }

    .card {
      background: #211e28;
      border: 1px solid #35313d;
      border-radius: 18px;
      padding: 28px 24px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    }

    .title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 22px;
    }

    .message {
      font-size: 17px;
      line-height: 1.7;
    }

    .pink {
      color: #e9c9dc;
    }

    .purple {
      color: #b9b2ff;
    }

    .small {
      color: #c8c4ce;
      font-size: 15px;
      line-height: 1.6;
      margin-top: 10px;
      margin-bottom: 24px;
    }

    .verify-button {
      display: block;
      width: 100%;
      text-align: center;
      padding: 15px 20px;
      background: #5865F2;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
    }

    .verify-button:active {
      transform: scale(0.98);
      opacity: 0.9;
    }

    .bottom {
      margin-top: 22px;
      color: #aaa5b2;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>

<body>

  <div class="container">
    <div class="card">

      <div class="title">
        <span class="pink">୨୧</span>
        welcome to .gg/chuppys!
        <span class="pink">♡</span>
      </div>

      <div class="message">
        <span class="purple">♡</span>
        please verify below
      </div>

      <div class="small">
        Connect your Discord account to complete verification
        and receive the <strong>Verified</strong> role.
      </div>

      <a class="verify-button" href="${discordURL}">
        ♡ Verify with Discord ♡
    
      </a>

      <div class="bottom">
        • enjoy .gg/chuppys // • ୨୧
      </div>

    </div>
  </div>

</body>
</html>
  `);
}
