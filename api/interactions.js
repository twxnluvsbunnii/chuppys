
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

export const config = { api: { bodyParser: false } };

// ==================================================
// CONFIGURATION — EXISTING FEATURES PRESERVED
// ==================================================
const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";
const PERSONAL_SELLER_IDS = ["1530733554869473320", "1490962480963260466"];
const VOUCH_EMOJI_URL = "https://cdn.discordapp.com/emojis/1561197586554036318.png";
const CLIENT_ROLE_BUTTON_ID = "chuppys_client";
const CLIENT_ROLE_ID = "1550373434301878282";
const QUESTION_CHANNEL_ID = "1566490648549527602";
const TICKET_CHANNEL_ID = "1530811385678790716";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";
const QUESTION_EMOJI_ID = "1561388594625511514";
const QUESTION_EMOJI_URL = `https://cdn.discordapp.com/emojis/${QUESTION_EMOJI_ID}.png?size=128&quality=lossless`;
const QUESTION_EMOJI = "<:chuppypayment:1561388594625511514>";
const QUESTION_TICKET_CUSTOM_ID = "question_ticket:";
const QUESTION_REPLY_CUSTOM_ID = "question_reply:";
const QUESTION_MODAL_CUSTOM_ID = "question_reply_modal:";
const REQUEST_CHANNEL_ID = "1569732416388726834";
const REQUEST_THUMBNAIL_URL = QUESTION_EMOJI_URL;
const REQUEST_CATEGORIES = new Set(["Baddies", "MM2", "Adopt Me", "Blade Ball", "Robux"]);
const VERIFY_CUSTOM_ID = "chuppys_verify";
const CHUPPYS_ROLE_ID = "1550230619127021568";
const ROLES_CHANNEL_ID = "1530808091380285592";
const AGE_ROLE_IDS = ["1531084465126772877", "1531084550849954003", "1531084611399188640"];
const PRONOUN_ROLE_IDS = ["1531084942241697854", "1531086100867842190", "1531101006451048448"];
const PING_ROLE_IDS = ["1531039846871728248", "1531084435716571137", "1531104789075853472", "1531104886630907925", "1531105107586973696", "1551276593425682543", "1558913216602706011", "1568240267344093254", "1568240367076122634", "1568283533879939123", "1568240484206514248"];
const ROLE_GROUPS = {
  chuppys_self_roles: { roles: PING_ROLE_IDS, success: "﹕𐔌・your roles have been updated〃・꒱ 🤍" },
  chuppys_second_roles: { roles: AGE_ROLE_IDS, success: "﹕𐔌・your age roles have been updated〃・꒱ 🤍" },
  chuppys_pronoun_roles: { roles: PRONOUN_ROLE_IDS, success: "﹕𐔌・your pronouns have been updated〃・꒱ 🤍" }
};

function getVouchChannelId(sellerId) {
  return PERSONAL_SELLER_IDS.includes(sellerId) ? PERSONAL_VOUCH_CHANNEL_ID : VOUCH_CHANNEL_ID;
}

console.log("[INTERACTIONS DEBUG] api/interactions.js loaded.");

// ==================================================
// DISCORD SIGNATURE VALIDATION
// ==================================================
async function getRawBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 100000) throw new Error("Request body too large.");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function verifyDiscordSignature(body, signature, timestamp, publicKeyHex) {
  try {
    if (typeof signature !== "string" || typeof timestamp !== "string" ||
        !/^[0-9a-f]{128}$/i.test(signature) ||
        typeof publicKeyHex !== "string" || !/^[0-9a-f]{64}$/i.test(publicKeyHex)) return false;
    const key = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(publicKeyHex, "hex")
      ]), format: "der", type: "spki"
    });
    return crypto.verify(null, Buffer.concat([Buffer.from(timestamp, "utf8"), body]), key, Buffer.from(signature, "hex"));
  } catch (error) {
    console.error("[INTERACTIONS DEBUG] Signature error:", error.message);
    return false;
  }
}

async function discordFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    throw new Error(error.name === "AbortError" ? "Discord API request timed out after 8 seconds." : `Discord API network error: ${error.message}`);
  } finally { clearTimeout(timeout); }
}

function botHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is missing from Vercel Environment Variables.");
  return { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
}

async function postChannelMessage(channelId, payload) {
  const result = await discordFetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST", headers: botHeaders(), body: JSON.stringify(payload)
  });
  if (!result.ok) throw new Error(`Could not send message: HTTP ${result.status} ${JSON.stringify(result.data)}`);
  return result.data;
}

async function getMemberRoles(guildId, userId, botToken) {
  const result = await discordFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
    method: "GET", headers: { Authorization: `Bot ${botToken}` }
  });
  if (!result.ok) throw new Error(`Could not retrieve member roles: HTTP ${result.status} ${JSON.stringify(result.data)}`);
  return result.data.roles || [];
}

async function updateOriginalResponse(interaction, contentOrPayload) {
  const payload = typeof contentOrPayload === "string" ? { content: contentOrPayload } : contentOrPayload;
  const result = await discordFetch(
    `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
  );
  if (!result.ok) throw new Error(`Could not update interaction response: HTTP ${result.status} ${JSON.stringify(result.data)}`);
}

function hasStaffPermission(interaction) {
  const member = interaction.member;
  if (!member) return false;
  if ((member.roles || []).includes(TICKET_SUPPORT_ROLE_ID)) return true;
  const permissions = BigInt(member.permissions || "0");
  return (permissions & 8n) === 8n || (permissions & 32n) === 32n || (permissions & 8192n) === 8192n;
}

function ephemeral(content) { return { type: 4, data: { content, flags: 64 } }; }
function deferEphemeral(res, task) {
  res.status(200).json({ type: 5, data: { flags: 64 } });
  waitUntil(task);
}
function optionsMap(interaction) {
  return Object.fromEntries((interaction.data?.options || []).map(option => [option.name, option.value]));
}

// ==================================================
// ROLE MENU HANDLER
// ==================================================
async function changeRoles(interaction, group) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  if (!botToken || !guildId || !userId) throw new Error("Missing bot token, server ID, or member ID.");
  const selectedRoles = new Set(interaction.data.values || []);
  for (const roleId of selectedRoles) {
    if (!group.roles.includes(roleId)) throw new Error(`Unexpected role ID: ${roleId}`);
  }
  const currentRoles = new Set(await getMemberRoles(guildId, userId, botToken));
  for (const roleId of group.roles) {
    const shouldHaveRole = selectedRoles.has(roleId);
    if (shouldHaveRole === currentRoles.has(roleId)) continue;
    const result = await discordFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: shouldHaveRole ? "PUT" : "DELETE", headers: { Authorization: `Bot ${botToken}` }
    });
    if (!result.ok) throw new Error(`Role ${roleId} failed: HTTP ${result.status} ${JSON.stringify(result.data)}`);
    console.log(`[ROLE DEBUG] ${shouldHaveRole ? "Added" : "Removed"} ${roleId} for ${userId}`);
  }
}

async function processRoleInteraction(interaction, group) {
  try {
    await changeRoles(interaction, group);
    await updateOriginalResponse(interaction, group.success);
  } catch (error) {
    console.error("[ROLE DEBUG] Failed:", error);
    await updateOriginalResponse(interaction, "﹕𐔌・role update failed. Please contact staff.〃・꒱ 🤍").catch(console.error);
  }
}

// ==================================================
// CLIENT ROLE BUTTON HANDLER
// ==================================================
async function processClientRole(interaction) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    if (!botToken || !guildId || !userId) throw new Error("Missing bot token, server ID, or member ID.");
    const roles = await getMemberRoles(guildId, userId, botToken);
    if (roles.includes(CLIENT_ROLE_ID)) {
      await updateOriginalResponse(interaction, "﹕𐔌・you already have the client role! you're ready to vouch. 🤍");
      return;
    }
    const result = await discordFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${CLIENT_ROLE_ID}`, {
      method: "PUT", headers: { Authorization: `Bot ${botToken}` }
    });
    if (!result.ok) throw new Error(`Could not grant client role: HTTP ${result.status} ${JSON.stringify(result.data)}`);
    await updateOriginalResponse(interaction, "﹕𐔌・you now have the client role! you can successfully submit a vouch. thank you for shopping at .gg/chuppys! 🤍");
  } catch (error) {
    console.error("[CLIENT DEBUG] Failed:", error);
    await updateOriginalResponse(interaction, "Your client role could not be added. Please contact staff.").catch(console.error);
  }
}

// ==================================================
// VERIFICATION BUTTON HANDLER
// ==================================================
async function processVerification(interaction) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    if (!botToken || !guildId || !userId) throw new Error("Missing bot token, server ID, or member ID.");
    const roles = new Set(await getMemberRoles(guildId, userId, botToken));
    if (roles.has(CHUPPYS_ROLE_ID)) {
      await updateOriginalResponse(interaction, "﹕𐔌・you are already verified! welcome to .gg/chuppys 🤍");
      return;
    }
    const hasAgeRole = AGE_ROLE_IDS.some(id => roles.has(id));
    const hasPronounRole = PRONOUN_ROLE_IDS.some(id => roles.has(id));
    const pingRoleCount = PING_ROLE_IDS.filter(id => roles.has(id)).length;
    if (!hasAgeRole || !hasPronounRole || pingRoleCount < 2) {
      await updateOriginalResponse(interaction, `Please select your roles in <#${ROLES_CHANNEL_ID}> before verifying to gain full access to .gg/chuppys. 🤍`);
      return;
    }
    const result = await discordFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${CHUPPYS_ROLE_ID}`, {
      method: "PUT", headers: { Authorization: `Bot ${botToken}` }
    });
    if (!result.ok) throw new Error(`Could not grant Chuppys role: HTTP ${result.status} ${JSON.stringify(result.data)}`);
    await updateOriginalResponse(interaction, "﹕𐔌・you are now verified! welcome to .gg/chuppys 🤍");
  } catch (error) {
    console.error("[VERIFY DEBUG] Verification failed:", error);
    await updateOriginalResponse(interaction, "Verification failed. Please contact staff for help.").catch(console.error);
  }
}

// ==================================================
// /VOUCH — ORIGINAL BEHAVIOR PRESERVED
// ==================================================
async function processVouchInteraction(interaction) {
  try {
    console.log("[VOUCH DEBUG] Processing /vouch.");
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) throw new Error("DISCORD_BOT_TOKEN is missing from Vercel Environment Variables.");
    if (!interaction.guild_id) throw new Error("Use /vouch inside your Discord server.");
    const buyerId = interaction.member?.user?.id || interaction.user?.id;
    if (!buyerId) throw new Error("Could not identify the buyer.");
    const buyerRoles = await getMemberRoles(interaction.guild_id, buyerId, botToken);
    if (!buyerRoles.includes(CLIENT_ROLE_ID)) {
      await updateOriginalResponse(interaction, "You need the client role before submitting a vouch! Please click the **client** button in the client-role message in .gg/chuppys. 🤍");
      return;
    }
    const options = optionsMap(interaction);
    const resolved = interaction.data.resolved || {};
    const sellerId = options.seller;
    const rating = options.rating;
    const order = options.order?.trim();
    const proof = resolved.attachments?.[options.proof];
    const seller = resolved.users?.[sellerId];
    if (!sellerId || !buyerId) throw new Error("Could not identify the buyer or seller.");
    if (seller?.bot) throw new Error("You cannot vouch for a bot.");
    if (sellerId === buyerId) throw new Error("You cannot vouch for yourself.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");
    if (!order) throw new Error("Please enter what you purchased.");
    if (order.length > 500) throw new Error("Your order description must be 500 characters or fewer.");
    if (!proof) throw new Error("Please attach proof of your purchase.");
    const isImage = proof.content_type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(proof.filename || "");
    if (!isImage) throw new Error("Proof must be a PNG, JPG, GIF, or WEBP image.");
    const embed = {
      color: 0xffffff, title: "NEW VOUCH", thumbnail: { url: VOUCH_EMOJI_URL },
      description: `**seller:** <@${sellerId}>\n**buyer:** <@${buyerId}>\n**items purchased:** ${order}\n**rating:** ${rating}/5\n**proof:** 📎 ${proof.filename || "Purchase proof"}\n\n*thank you for vouching! shop again ♡*`,
      image: { url: proof.url }, timestamp: new Date().toISOString()
    };
    const targetChannelId = getVouchChannelId(sellerId);
    const result = await postChannelMessage(targetChannelId, {
      embeds: [embed], allowed_mentions: { parse: [], users: [sellerId, buyerId] }
    });
    console.log(`[VOUCH DEBUG] Posted ${result?.id || "unknown"} to ${targetChannelId}`);
    await updateOriginalResponse(interaction, "Your vouch was submitted successfully! ♡");
  } catch (error) {
    console.error("[VOUCH DEBUG] /vouch failed:", error);
    await updateOriginalResponse(interaction, `❌ ${error.message || "Your vouch could not be submitted."}`).catch(console.error);
  }
}

// ==================================================
// /QUESTION — ORIGINAL BEHAVIOR PRESERVED
// ==================================================
async function processQuestionInteraction(interaction) {
  try {
    if (!interaction.guild_id) throw new Error("Use /question inside your Discord server.");
    if (interaction.channel_id !== QUESTION_CHANNEL_ID) {
      await updateOriginalResponse(interaction, `Please use /question in <#${QUESTION_CHANNEL_ID}>.`);
      return;
    }
    const options = optionsMap(interaction);
    const questionText = options.question?.trim();
    const picture = options.picture ? interaction.data.resolved?.attachments?.[options.picture] : null;
    if (!questionText) throw new Error("Please enter your question.");
    if (picture && !(picture.content_type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(picture.filename || ""))) {
      await updateOriginalResponse(interaction, "Please attach an image file for the picture option.");
      return;
    }
    const askerId = interaction.member?.user?.id || interaction.user?.id;
    if (!askerId) throw new Error("Could not identify the member.");
    const embed = {
      title: `Question from @${interaction.member?.user?.username || interaction.user?.username || "Member"}`,
      color: 0xffffff, description: `**Question**\n${questionText}`,
      thumbnail: { url: QUESTION_EMOJI_URL },
      footer: { text: `.gg/chuppys • Question User ID: ${askerId}` },
      timestamp: new Date().toISOString()
    };
    if (picture?.url) embed.image = { url: picture.url };
    const components = [{ type: 1, components: [
      { type: 2, style: 2, label: "Make a Support Ticket", custom_id: `${QUESTION_TICKET_CUSTOM_ID}${askerId}` },
      { type: 2, style: 1, label: "Reply to Question", custom_id: `${QUESTION_REPLY_CUSTOM_ID}${askerId}` }
    ] }];
    await postChannelMessage(QUESTION_CHANNEL_ID, { embeds: [embed], components, allowed_mentions: { parse: [] } });
    await updateOriginalResponse(interaction, "Your question was sent to Chuppys staff! ♡");
  } catch (error) {
    console.error("[QUESTION DEBUG] Failed:", error);
    await updateOriginalResponse(interaction, `Your question could not be sent: ${error.message}`).catch(console.error);
  }
}

// ==================================================
// /REQUEST — NEW: CHANNEL RESTRICTION + THUMBNAIL
// ==================================================
async function processRequestInteraction(interaction) {
  try {
    if (!interaction.guild_id) throw new Error("Use /request inside the Chuppys server.");
    if (interaction.channel_id !== REQUEST_CHANNEL_ID) {
      await updateOriginalResponse(interaction, `Please use /request in <#${REQUEST_CHANNEL_ID}>.`);
      return;
    }
    const options = optionsMap(interaction);
    const category = options.category;
    const items = typeof options.items === "string" ? options.items.trim() : "";
    if (!REQUEST_CATEGORIES.has(category)) throw new Error("Please select a valid request category.");
    if (!items || items.length > 1000) throw new Error("Enter what you want (up to 1000 characters).");
    const requesterId = interaction.member?.user?.id || interaction.user?.id;
    if (!requesterId) throw new Error("Could not identify the requester.");
    const embed = {
      title: `${category} Request`, color: 0xffffff,
      description: `**Requested by:** <@${requesterId}>\n\n**What they'd like Chuppys to stock up on:**\n${items}`,
      thumbnail: { url: REQUEST_THUMBNAIL_URL },
      footer: { text: ".gg/chuppys" }, timestamp: new Date().toISOString()
    };
    await postChannelMessage(REQUEST_CHANNEL_ID, { embeds: [embed], allowed_mentions: { parse: [] } });
    await updateOriginalResponse(interaction, `Your **${category}** request has been submitted! Thank you for helping Chuppys decide what to stock.`);
  } catch (error) {
    console.error("[REQUEST DEBUG] Failed:", error);
    await updateOriginalResponse(interaction, `Your request could not be submitted: ${error.message}`).catch(console.error);
  }
}

// ==================================================
// /HELP — NEW: WORKS ON VERCEL
// ==================================================
function makeHelpEmbed() {
  return {
    title: ".gg/chuppys Bot Commands", color: 0xffffff,
    description: "Here is a list of available commands and what they do.\n\nUse the commands below to access the bot's features.",
    fields: [
      { name: "General Commands", value: "`/help` — Displays this command menu.\n`/question` — Submit a question to the Chuppys team.\n`/request` — Request items for Chuppys to stock up on.\n`/vouch` — Submit a vouch for a completed transaction.\n`,afk [reason]` — Set your AFK status.\n`,pay` — Displays available payment methods.\n`,client` — Posts or updates the client-role message." },
      { name: "Support Commands", value: "`,r @user c` — Gives a member the Chuppys role.\n`,r @user r` — Sends a member a vouch reminder.\n`,partner` — Displays partnership instructions.\n`,mod` — Displays moderator responsibilities.\n`,seller` — Displays seller application information.\n`,promoter` — Displays promoter responsibilities and application questions." },
      { name: "Service Commands", value: "`,nitro` / `!nitro` — Updates the Nitro price list.\n`,decor` / `!decor` — Updates the Decor price list.\n`,boosties` / `!boosties` — Updates the Boosties price list.\n`,sellers` / `!sellers` — Posts the seller list.\n`,staff` / `!staff` — Posts the staff list." },
      { name: "Additional Commands", value: "`!vouchtut` — Posts the vouch tutorial.\n`!ranked` — Posts the ranked roles list.\n`!robuxcashout` — Posts Robux cashout rates.\n`!testwelcome` — Tests the welcome embed.\n`!testgoodbye` — Tests the goodbye embed." }
    ],
    thumbnail: { url: "https://cdn.discordapp.com/emojis/1569039366880235560.png" },
    footer: { text: ".gg/chuppys" }
  };
}

// ==================================================
// QUESTION BUTTONS AND PRIVATE STAFF REPLIES
// ==================================================
function handleQuestionTicketButton() {
  return { type: 4, data: { flags: 64, embeds: [{
    color: 0xffffff,
    description: `This question requires a support ticket.\n\nPlease make one in <#${TICKET_CHANNEL_ID}> and @ Ticket Support for assistance.\n\nThank you! <:uppyty:1561094713153429746>`,
    thumbnail: { url: QUESTION_EMOJI_URL }, footer: { text: ".gg/chuppys" }
  }], allowed_mentions: { parse: [] } } };
}

function handleQuestionReplyButton(interaction) {
  if (!hasStaffPermission(interaction)) return ephemeral("Only the owner, administrators, moderators, or Ticket Support can reply to questions.");
  const askerId = interaction.data.custom_id.slice(QUESTION_REPLY_CUSTOM_ID.length);
  if (!/^\d{17,20}$/.test(askerId)) return ephemeral("This question button is invalid.");
  return { type: 9, data: {
    custom_id: `${QUESTION_MODAL_CUSTOM_ID}${askerId}:${interaction.message.id}`,
    title: "Reply to Question",
    components: [{ type: 1, components: [{
      type: 4, custom_id: "question_reply_text", label: "Your response", style: 2,
      min_length: 1, max_length: 2000, placeholder: "Type your answer to the member...", required: true
    }] }]
  } };
}

async function processQuestionReply(interaction) {
  try {
    if (!hasStaffPermission(interaction)) throw new Error("Only authorized staff can answer questions.");
    const match = interaction.data.custom_id.match(/^question_reply_modal:(\d{17,20}):(\d{17,20})$/);
    if (!match) throw new Error("Invalid question reply form.");
    const askerId = match[1];
    const originalMessageId = match[2];
    const actionRow = interaction.data.components?.find(component => component.type === 1);
    const answerText = actionRow?.components?.find(component => component.custom_id === "question_reply_text")?.value?.trim();
    if (!answerText) throw new Error("Please enter a response.");
    const staffId = interaction.member?.user?.id || interaction.user?.id;
    if (!staffId) throw new Error("Could not identify the staff member.");
    const dmResult = await discordFetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST", headers: botHeaders(), body: JSON.stringify({ recipient_id: askerId })
    });
    if (!dmResult.ok || !dmResult.data?.id) throw new Error("I couldn't open a DM with the member. They may have direct messages disabled.");
    const replyEmbed = {
      title: "Response to Your Question", color: 0xffffff,
      description: `${QUESTION_EMOJI} **Replied by:** <@${staffId}>\n\n**Response:**\n${answerText}`,
      thumbnail: { url: QUESTION_EMOJI_URL }, footer: { text: ".gg/chuppys" }, timestamp: new Date().toISOString()
    };
    await postChannelMessage(dmResult.data.id, { embeds: [replyEmbed], allowed_mentions: { parse: [] } });
    try {
      await postChannelMessage(QUESTION_CHANNEL_ID, {
        content: `A response was sent privately by <@${staffId}>.`,
        message_reference: { message_id: originalMessageId, fail_if_not_exists: false },
        allowed_mentions: { parse: [], users: [staffId] }
      });
    } catch (error) { console.warn("[QUESTION DEBUG] Could not post staff reply notice:", error); }
    await updateOriginalResponse(interaction, "Your response was sent to the member privately.");
  } catch (error) {
    console.error("[QUESTION DEBUG] Could not send staff response:", error);
    await updateOriginalResponse(interaction, `Could not send the response: ${error.message}`).catch(console.error);
  }
}

// ==================================================
// VERCEL INTERACTIONS ENDPOINT
// ==================================================
export default async function handler(req, res) {
  console.log(`[INTERACTIONS DEBUG] Received ${req.method} request.`);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }
  let body;
  try { body = await getRawBody(req); }
  catch (error) { console.error("[INTERACTIONS DEBUG] Could not read request:", error); return res.status(400).send("Invalid request body"); }
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!signature || !timestamp || !publicKey) return res.status(401).send("Missing signature information");
  if (!verifyDiscordSignature(body, signature, timestamp, publicKey)) return res.status(401).send("Invalid signature");
  let interaction;
  try { interaction = JSON.parse(body.toString("utf8")); }
  catch { return res.status(400).send("Invalid JSON"); }
  console.log("[INTERACTIONS DEBUG] Interaction received:", { type: interaction.type, command: interaction.data?.name || null, customId: interaction.data?.custom_id || null });
  if (interaction.type === 1) return res.status(200).json({ type: 1 });

  if (interaction.type === 2) {
    const commandName = interaction.data?.name;
    if (commandName === "help") {
      return res.status(200).json({ type: 4, data: { flags: 64, embeds: [makeHelpEmbed()] } });
    }
    if (commandName === "request") {
      deferEphemeral(res, processRequestInteraction(interaction));
      return;
    }
    if (commandName === "vouch") {
      deferEphemeral(res, processVouchInteraction(interaction));
      return;
    }
    if (commandName === "question") {
      deferEphemeral(res, processQuestionInteraction(interaction));
      return;
    }
    return res.status(200).json(ephemeral("This slash command is not configured on the Vercel endpoint."));
  }

  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id;
    if (customId === CLIENT_ROLE_BUTTON_ID) {
      if (!interaction.guild_id) return res.status(200).json(ephemeral("You must use this button inside Chuppys."));
      deferEphemeral(res, processClientRole(interaction));
      return;
    }
    if (customId === VERIFY_CUSTOM_ID) {
      if (!interaction.guild_id) return res.status(200).json(ephemeral("You must verify inside the Chuppys server."));
      deferEphemeral(res, processVerification(interaction));
      return;
    }
    if (typeof customId === "string" && customId.startsWith(QUESTION_TICKET_CUSTOM_ID)) {
      return res.status(200).json(handleQuestionTicketButton(interaction));
    }
    if (typeof customId === "string" && customId.startsWith(QUESTION_REPLY_CUSTOM_ID)) {
      return res.status(200).json(handleQuestionReplyButton(interaction));
    }
    const group = Object.prototype.hasOwnProperty.call(ROLE_GROUPS, customId) ? ROLE_GROUPS[customId] : null;
    if (!group || !Array.isArray(interaction.data?.values)) return res.status(200).json(ephemeral("This interaction is not configured."));
    if (interaction.data.values.some(roleId => !group.roles.includes(roleId))) return res.status(200).json(ephemeral("Invalid role selection."));
    deferEphemeral(res, processRoleInteraction(interaction, group));
    return;
  }

  if (interaction.type === 5) {
    const customId = interaction.data?.custom_id || "";
    if (customId.startsWith(QUESTION_MODAL_CUSTOM_ID)) {
      if (!hasStaffPermission(interaction)) return res.status(200).json(ephemeral("Only the owner, administrators, moderators, or Ticket Support can reply to questions."));
      deferEphemeral(res, processQuestionReply(interaction));
      return;
    }
    return res.status(200).json(ephemeral("This form is not configured."));
  }
  return res.status(200).json(ephemeral("This interaction type is not supported."));
}
