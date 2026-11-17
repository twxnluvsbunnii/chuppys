
"use strict";

// ============================================================
// CHUPPYS SECURITY SYSTEM — DISCORD.JS V14
// ============================================================
//
// INSTALL IN INDEX.JS:
// require("./security")(client);
//
// FEATURES:
// - Block Discord accounts younger than 30 days
// - Automatically kick accounts that are too new
// - Timeout eligible new members for 10 minutes
// - Automatic DM notifications
// - Optional security logs
// - No database required
// - Compatible with Render
// - Independent from tickets.js
//
// REQUIRED BOT PERMISSIONS:
// - Kick Members
// - Moderate Members
// - View Channel (for logs)
// - Send Messages (for logs)
//
// REQUIRED INTENT:
// - GuildMembers
//
// ============================================================

const {
  Events,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Accounts must be at least 30 days old.
  minimumAccountAgeDays: 30,

  // New members wait 10 minutes before interacting.
  waitingPeriodMinutes: 10,

  // Automatically remove accounts that are too new.
  kickNewAccounts: true,

  // Apply Discord timeout to eligible new members.
  timeoutNewMembers: true,

  // Send private messages to new members.
  sendDMs: true,

  // Optional staff logging channel ID.
  // Leave empty to disable Discord channel logs.
  logChannelId: process.env.SECURITY_LOG_CHANNEL_ID || "",

  // Optional server ID.
  // Leave empty to protect every server using this bot.
  guildId: process.env.SECURITY_GUILD_ID || "",

  // Embed color.
  color: 0x5865f2,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MODULE_KEY = Symbol.for("chuppys.security.installed");

// ============================================================
// UTILITIES
// ============================================================

function getAccountAgeDays(user) {
  return (Date.now() - user.createdTimestamp) / DAY_MS;
}

function formatAge(days) {
  return `${days.toFixed(2)} days`;
}

async function sendDM(user, embed) {
  if (!CONFIG.sendDMs) return;

  try {
    await user.send({ embeds: [embed] });
  } catch {
    // DMs may be disabled or unavailable.
  }
}

async function sendLog(guild, embed) {
  if (!CONFIG.logChannelId) return;

  try {
    const channel = await guild.channels.fetch(
      CONFIG.logChannelId
    );

    if (!channel || !channel.isTextBased()) return;

    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    console.error(
      "[CHUPPYS SECURITY] Could not send log:",
      error
    );
  }
}

function makeEmbed(title, description, color) {
  return new EmbedBuilder()
    .setColor(color ?? CONFIG.color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

async function logError(member, action, error) {
  console.error(
    `[CHUPPYS SECURITY] ${action}:`,
    error
  );

  const embed = makeEmbed(
    "Security Action Failed",
    [
      `**Member:** ${member.user.tag}`,
      `**User ID:** \`${member.id}\``,
      `**Action:** ${action}`,
      `**Error:** ${String(error.message || error).slice(0, 900)}`,
    ].join("\n"),
    0xed4245
  );

  await sendLog(member.guild, embed);
}

// ============================================================
// ACCOUNT AGE PROTECTION
// ============================================================

async function handleYoungAccount(member, ageDays) {
  const minimum = CONFIG.minimumAccountAgeDays;
  const remaining = Math.max(0, minimum - ageDays);

  const dmEmbed = makeEmbed(
    "Chuppys | Account Age Requirement",
    [
      `You cannot join **${member.guild.name}** yet.`,
      "",
      `Your Discord account must be at least **${minimum} days old** to join.`,
      "",
      `**Your account age:** ${formatAge(ageDays)}`,
      `**Time remaining:** ${remaining.toFixed(2)} days`,
      "",
      "You may join again once your account meets",
      "the minimum account age requirement.",
    ].join("\n"),
    0xed4245
  );

  await sendDM(member.user, dmEmbed);

  if (!CONFIG.kickNewAccounts) return;

  if (!member.kickable) {
    await logError(
      member,
      "Account age kick",
      new Error("Member is not kickable. Check role hierarchy.")
    );
    return;
  }

  try {
    await member.kick(
      `Account younger than ${minimum} days`
    );

    console.log(
      `[CHUPPYS SECURITY] Kicked ${member.user.tag} ` +
      `(account age: ${formatAge(ageDays)})`
    );

    const logEmbed = makeEmbed(
      "Account Age Protection | Kick",
      [
        `**Member:** ${member.user.tag}`,
        `**User ID:** \`${member.id}\``,
        `**Account Age:** ${formatAge(ageDays)}`,
        `**Minimum Age:** ${minimum} days`,
        `**Action:** Automatically kicked`,
      ].join("\n"),
      0xed4245
    );

    await sendLog(member.guild, logEmbed);
  } catch (error) {
    await logError(member, "Account age kick", error);
  }
}

// ============================================================
// 10-MINUTE WAITING PERIOD
// ============================================================

async function handleWaitingPeriod(member, ageDays) {
  if (!CONFIG.timeoutNewMembers) return;

  const minutes = CONFIG.waitingPeriodMinutes;
  const durationMs = minutes * 60 * 1000;

  if (!member.moderatable) {
    await logError(
      member,
      "New member timeout",
      new Error(
        "Member cannot be timed out. Check role hierarchy " +
        "and Administrator permissions."
      )
    );
    return;
  }

  try {
    await member.timeout(
      durationMs,
      `New member security waiting period: ${minutes} minutes`
    );

    console.log(
      `[CHUPPYS SECURITY] Timed out ${member.user.tag} ` +
      `for ${minutes} minutes`
    );

    const dmEmbed = makeEmbed(
      "Welcome to Chuppys!",
      [
        `Welcome to **${member.guild.name}**!`,
        "",
        "Your Discord account passed our",
        "30-day account age requirement.",
        "",
        `**Security waiting period:** ${minutes} minutes`,
        "",
        "During this period, you can read server",
        "channels but cannot send messages.",
        "",
        "Discord will automatically remove",
        "your timeout when the waiting period ends.",
        "",
        "Thank you for helping keep our server safe!",
      ].join("\n"),
      0x57f287
    );

    const logEmbed = makeEmbed(
      "New Member | Waiting Period",
      [
        `**Member:** ${member.user.tag}`,
        `**User ID:** \`${member.id}\``,
        `**Account Age:** ${formatAge(ageDays)}`,
        `**Waiting Period:** ${minutes} minutes`,
        "**Status:** Timeout applied successfully",
      ].join("\n"),
      0x57f287
    );

    await Promise.all([
      sendDM(member.user, dmEmbed),
      sendLog(member.guild, logEmbed),
    ]);
  } catch (error) {
    await logError(member, "New member timeout", error);
  }
}

// ============================================================
// MEMBER JOIN EVENT
// ============================================================

async function handleMemberJoin(member) {
  if (!member || !member.guild || !member.user) return;
  if (member.user.bot) return;

  if (CONFIG.guildId && member.guild.id !== CONFIG.guildId) {
    return;
  }

  const me = await member.guild.members.fetchMe();

  if (
    CONFIG.kickNewAccounts &&
    !me.permissions.has(PermissionFlagsBits.KickMembers)
  ) {
    console.error(
      "[CHUPPYS SECURITY] Missing Kick Members permission."
    );
  }

  if (
    CONFIG.timeoutNewMembers &&
    !me.permissions.has(PermissionFlagsBits.ModerateMembers)
  ) {
    console.error(
      "[CHUPPYS SECURITY] Missing Moderate Members permission."
    );
  }

  const ageDays = getAccountAgeDays(member.user);

  if (ageDays < CONFIG.minimumAccountAgeDays) {
    await handleYoungAccount(member, ageDays);
    return;
  }

  await handleWaitingPeriod(member, ageDays);
}

// ============================================================
// INSTALL SECURITY SYSTEM
// ============================================================

module.exports = function installSecurity(client) {
  if (!client) {
    throw new Error(
      "[CHUPPYS SECURITY] Discord client is required."
    );
  }

  if (client[MODULE_KEY]) {
    console.log(
      "[CHUPPYS SECURITY] Already installed."
    );
    return;
  }

  client[MODULE_KEY] = true;

  client.on(Events.GuildMemberAdd, (member) => {
    handleMemberJoin(member).catch((error) => {
      console.error(
        "[CHUPPYS SECURITY] Member join handler failed:",
        error
      );
    });
  });

  console.log(
    "[CHUPPYS SECURITY] Security protection loaded."
  );

  console.log(
    `[CHUPPYS SECURITY] Minimum account age: ` +
    `${CONFIG.minimumAccountAgeDays} days`
  );

  console.log(
    `[CHUPPYS SECURITY] Waiting period: ` +
    `${CONFIG.waitingPeriodMinutes} minutes`
  );
};
