"use strict";

// ============================================================
// CHUPPYS TIKTOK LIVE NOTIFICATIONS
// DISCORD.JS V14 / RENDER
// COMPLETE UPDATED TIKTOK.JS
// ============================================================
//
// FEATURES:
// - Automatically monitors both TikTok accounts.
// - Checks every 30 seconds.
// - Fresh connection for every check.
// - Multiple live detection methods.
// - Announces confirmed lives even without a room ID.
// - Duplicate announcement protection.
// - Persistent JSON storage.
// - Discord message backup duplicate detection.
// - Detailed Render logs.
// - Manual announcement test commands.
// - Manual live status check command.
//
// STAFF COMMANDS:
// ,testlive minitwxn
// ,testlive twxn
// ,tiktokstatus
//
// REQUIREMENTS:
// discord.js v14
// tiktok-live-connector
// Compatible Node.js version
//
// ============================================================

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionFlagsBits
} = require("discord.js");

// ============================================================
// CONFIGURATION
// ============================================================

const LIVE_CHANNEL_ID =
  "1574946167274348544";

const THUMBNAIL_EMOJI_ID =
  "1575025948993003590";

const THUMBNAIL_URL =
  `https://cdn.discordapp.com/emojis/${THUMBNAIL_EMOJI_ID}.png?size=128&quality=lossless`;

const EMBED_COLOR = 0xffffff;

const FOOTER_TEXT = ".gg/chuppys";

const CHECK_INTERVAL = 30 * 1000;

const REQUEST_TIMEOUT = 25 * 1000;

const OFFLINE_CONFIRMATIONS = 2;

const ACCOUNT_DELAY = 3000;

const DATA_DIRECTORY =
  process.env.TIKTOK_DATA_DIR || __dirname;

const DATA_FILE = path.join(
  DATA_DIRECTORY,
  "tiktok-live-data.json"
);

// ============================================================
// STAFF ROLES
// ============================================================

const STAFF_ROLE_IDS = [
  "1530988662970650865",
  "1531800870444994641",
  "1531800784700706887"
];

// ============================================================
// TIKTOK ACCOUNTS
// ============================================================

const ACCOUNTS = [
  {
    username: "minitwxn",

    displayName: "minitwxn",

    liveUrl:
      "https://www.tiktok.com/@minitwxn/live"
  },

  {
    username: "a04120326",

    displayName: "twxn",

    liveUrl:
      "https://www.tiktok.com/@a04120326/live"
  }
];

// ============================================================
// RUNTIME STATE
// ============================================================

const initializedClients = new WeakSet();

const accountLocks = new Set();

const runtimeStatus = new Map();

let savedData = {};

let TikTokConnection = null;

let loadingConnector = null;

let checking = false;

let monitoringStarted = false;

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function errorText(error) {
  return String(
    error?.message || error || "Unknown error"
  ).slice(0, 500);
}

function safeError(error) {
  let value = errorText(error);

  const key =
    process.env.TIKTOK_SIGN_API_KEY;

  if (key) {
    value = value.split(key).join("[REDACTED]");
  }

  return value;
}

function normalizeRoomId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "number" &&
    !Number.isSafeInteger(value)
  ) {
    return null;
  }

  const result = String(value).trim();

  if (!/^[1-9]\d*$/.test(result)) {
    return null;
  }

  return result;
}

function getAccount(value) {
  const name = String(value || "")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

  return ACCOUNTS.find(
    account =>
      account.username.toLowerCase() === name ||
      account.displayName.toLowerCase() === name
  );
}

function canManageTikTok(member) {
  if (!member?.guild) {
    return false;
  }

  return Boolean(
    member.id === member.guild.ownerId ||

    member.permissions?.has(
      PermissionFlagsBits.ManageGuild
    ) ||

    STAFF_ROLE_IDS.some(
      id => member.roles.cache.has(id)
    )
  );
}

// ============================================================
// REQUEST TIMEOUT
// ============================================================

async function withTimeout(task, label) {
  let timer;

  try {
    return await Promise.race([
      Promise.resolve().then(task),

      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(`${label} timed out`)
          );
        }, REQUEST_TIMEOUT);
      })
    ]);

  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// LOAD PERSISTENT DATA
// ============================================================

function loadData() {
  try {
    fs.mkdirSync(DATA_DIRECTORY, {
      recursive: true
    });

    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }

    const parsed = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    console.log(
      "[TikTok] Saved live data loaded."
    );

    return parsed;

  } catch (error) {
    console.error(
      "[TikTok] Data load failed:",
      safeError(error)
    );

    return {};
  }
}

// ============================================================
// SAVE PERSISTENT DATA
// ============================================================

function saveData() {
  try {
    fs.mkdirSync(DATA_DIRECTORY, {
      recursive: true
    });

    const temporary =
      `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      temporary,

      JSON.stringify(
        savedData,
        null,
        2
      ),

      "utf8"
    );

    fs.renameSync(
      temporary,
      DATA_FILE
    );

    return true;

  } catch (error) {
    console.error(
      "[TikTok] Data save failed:",
      safeError(error)
    );

    return false;
  }
}

// ============================================================
// LOAD TIKTOK CONNECTOR
// ============================================================

async function loadConnector() {
  if (TikTokConnection) {
    return TikTokConnection;
  }

  if (loadingConnector) {
    return loadingConnector;
  }

  loadingConnector = (async () => {
    let library;

    try {
      library = await import(
        "tiktok-live-connector"
      );

    } catch {
      library = require(
        "tiktok-live-connector"
      );
    }

    const Connection =
      library.TikTokLiveConnection ||

      library.WebcastPushConnection ||

      library.default?.TikTokLiveConnection ||

      library.default?.WebcastPushConnection;

    if (typeof Connection !== "function") {
      throw new Error(
        "TikTok connector class not found."
      );
    }

    TikTokConnection = Connection;

    console.log(
      `[TikTok] Connector loaded: ${Connection.name}`
    );

    return Connection;
  })();

  try {
    return await loadingConnector;

  } finally {
    loadingConnector = null;
  }
}

// ============================================================
// CREATE FRESH CONNECTION
// ============================================================

async function createConnection(username) {
  const Connection =
    await loadConnector();

  const options = {
    processInitialData: false,

    enableExtendedGiftInfo: false,

    fetchRoomInfoOnConnect: true
  };

  const apiKey =
    process.env.TIKTOK_SIGN_API_KEY ||
    process.env.SIGN_API_KEY;

  if (apiKey) {
    options.signApiKey = apiKey;
  }

  return new Connection(
    username,
    options
  );
}

// ============================================================
// READ ROOM INFORMATION
// ============================================================

function parseRoomInfo(response) {
  const room =
    response?.data?.room_info ||
    response?.room_info ||
    response?.data?.room ||
    response?.room ||
    response?.data ||
    response;

  if (!room || typeof room !== "object") {
    return null;
  }

  const roomId =
    normalizeRoomId(room.id_str) ||
    normalizeRoomId(room.room_id_str) ||
    normalizeRoomId(room.roomId) ||
    normalizeRoomId(room.room_id) ||
    normalizeRoomId(room.id);

  const status = Number(room.status);

  if (
    room.isLive === true ||
    room.is_live === true ||
    status === 2
  ) {
    return {
      live: true,
      roomId
    };
  }

  if (
    room.isLive === false ||
    room.is_live === false ||
    status === 4
  ) {
    return {
      live: false,
      roomId: null
    };
  }

  return null;
}

// ============================================================
// METHOD ONE — FETCH IS LIVE
// ============================================================

async function checkLiveBoolean(connection) {
  if (
    typeof connection.fetchIsLive !== "function"
  ) {
    return null;
  }

  const result = await withTimeout(
    () => connection.fetchIsLive(),
    "fetchIsLive"
  );

  if (result === true) {
    return {
      live: true,

      roomId: null,

      source: "fetchIsLive"
    };
  }

  if (result === false) {
    return {
      live: false,

      roomId: null,

      source: "fetchIsLive"
    };
  }

  const parsed =
    parseRoomInfo(result);

  if (parsed) {
    return {
      ...parsed,
      source: "fetchIsLive"
    };
  }

  throw new Error(
    "Unexpected fetchIsLive response."
  );
}

// ============================================================
// METHOD TWO — FETCH ROOM INFORMATION
// ============================================================

async function checkRoomInformation(connection) {
  let result;

  if (
    typeof connection.fetchRoomInfo === "function"
  ) {
    result = await withTimeout(
      () => connection.fetchRoomInfo(),

      "fetchRoomInfo"
    );

  } else if (
    typeof connection.getRoomInfo === "function"
  ) {
    result = await withTimeout(
      () => connection.getRoomInfo(),

      "getRoomInfo"
    );

  } else {
    return null;
  }

  const parsed =
    parseRoomInfo(result);

  if (!parsed) {
    throw new Error(
      "Room information did not contain a clear live status."
    );
  }

  return {
    ...parsed,

    source: "room information"
  };
}

// ============================================================
// RESOLVE LIVE ROOM ID
// ============================================================

async function resolveRoomId(connection) {
  try {
    if (
      typeof connection.fetchRoomId === "function"
    ) {
      const result =
        await withTimeout(
          () => connection.fetchRoomId(),

          "fetchRoomId"
        );

      const roomId =
        normalizeRoomId(result) ||

        normalizeRoomId(result?.roomId) ||

        normalizeRoomId(result?.room_id) ||

        normalizeRoomId(result?.id_str) ||

        normalizeRoomId(result?.id);

      if (roomId) {
        return roomId;
      }
    }

  } catch (error) {
    console.warn(
      "[TikTok] Room ID lookup failed:",
      safeError(error)
    );
  }

  return null;
}

// ============================================================
// LIVE DETECTION
// ============================================================
//
// IMPORTANT:
// A confirmed live status is enough to send an
// announcement.
//
// Missing room IDs no longer prevent announcements.
//
// Failed API requests are treated as UNKNOWN,
// not automatically OFFLINE.
//
// ============================================================

async function fetchLiveStatus(account) {
  const connection =
    await createConnection(
      account.username
    );

  let booleanStatus = null;

  let roomStatus = null;

  const errors = [];

  // Primary detection method.

  try {
    booleanStatus =
      await checkLiveBoolean(
        connection
      );

  } catch (error) {
    errors.push(
      `fetchIsLive: ${safeError(error)}`
    );
  }

  // A confirmed live can be announced without
  // a room ID.

  if (booleanStatus?.live === true) {
    let roomId =
      booleanStatus.roomId;

    if (!roomId) {
      roomId = await resolveRoomId(
        connection
      );
    }

    return {
      live: true,
      roomId,
      source: booleanStatus.source
    };
  }

  // Secondary detection method.
  // Useful when the primary method fails.

  try {
    const freshConnection =
      await createConnection(
        account.username
      );

    roomStatus =
      await checkRoomInformation(
        freshConnection
      );

    if (roomStatus?.live === true) {
      let roomId = roomStatus.roomId;

      if (!roomId) {
        roomId = await resolveRoomId(
          freshConnection
        );
      }

      return {
        live: true,
        roomId,
        source: roomStatus.source
      };
    }

  } catch (error) {
    errors.push(
      `roomInfo: ${safeError(error)}`
    );
  }

  // Offline status returned successfully.

  if (
    booleanStatus?.live === false ||
    roomStatus?.live === false
  ) {
    return {
      live: false,
      roomId: null,

      source:
        booleanStatus?.source ||
        roomStatus?.source
    };
  }

  // No successful detection method.

  throw new Error(
    errors.join(" | ") ||
    "No supported live detection method."
  );
}

// ============================================================
// CREATE LIVE EMBED
// ============================================================

function createLiveEmbed(account, test = false) {
  return new EmbedBuilder()

    .setColor(EMBED_COLOR)

    .setTitle(
      test
        ? `[TEST] ${account.displayName} is now live!`
        : `${account.displayName} is now live!`
    )

    .setURL(
      account.liveUrl
    )

    .setDescription(
      "Join our TikTok live by pressing the link below!\n\n" +

      `[**Click here to join live**](${account.liveUrl})`
    )

    .setThumbnail(
      THUMBNAIL_URL
    )

    .setFooter({
      text: FOOTER_TEXT
    })

    .setTimestamp();
}

// ============================================================
// JOIN LIVE BUTTON
// ============================================================

function createLiveButton(account) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()

        .setLabel("Join Live")

        .setStyle(
          ButtonStyle.Link
        )

        .setURL(
          account.liveUrl
        )
    );
}

// ============================================================
// GET ANNOUNCEMENT CHANNEL
// ============================================================

async function getLiveChannel(client) {
  const channel =
    await client.channels.fetch(
      LIVE_CHANNEL_ID
    );

  if (
    !channel ||
    !channel.isTextBased() ||
    typeof channel.send !== "function"
  ) {
    throw new Error(
      `Announcement channel ${LIVE_CHANNEL_ID} is invalid.`
    );
  }

  if (channel.guild) {
    const permissions =
      channel.permissionsFor(
        client.user.id
      );

    if (
      !permissions?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
      ])
    ) {
      throw new Error(
        "Bot needs View Channel, Send Messages and Embed Links."
      );
    }
  }

  return channel;
}

// ============================================================
// BACKUP DUPLICATE DETECTION
// ============================================================

async function findPreviousAnnouncement(
  client,
  channel,
  account,
  sessionId
) {
  if (!channel.messages?.fetch) {
    return null;
  }

  try {
    const messages =
      await channel.messages.fetch({
        limit: 100
      });

    const marker =
      `TikTok Live: ${account.username}:${sessionId}`;

    return messages.find(
      message =>
        message.author.id === client.user.id &&

        message.embeds.some(
          embed =>
            embed.footer?.text === marker
        )
    ) || null;

  } catch (error) {
    console.warn(
      "[TikTok] Duplicate lookup failed:",
      safeError(error)
    );

    return null;
  }
}

// ============================================================
// SEND LIVE ANNOUNCEMENT
// ============================================================

async function sendLiveNotification(
  client,
  account,
  status,
  sessionId
) {
  const channel =
    await getLiveChannel(client);

  const existing =
    await findPreviousAnnouncement(
      client,
      channel,
      account,
      sessionId
    );

  let message = existing;

  if (!message) {
    const embed =
      createLiveEmbed(account);

    // A second hidden-in-practice metadata embed
    // stores the session identifier for restart recovery.

    const metadataEmbed =
      new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setFooter({
          text:
            `TikTok Live: ${account.username}:${sessionId}`
        });

    message = await channel.send({
      embeds: [
        embed,
        metadataEmbed
      ],

      components: [
        createLiveButton(account)
      ],

      allowedMentions: {
        parse: []
      }
    });
  }

  savedData[account.username] = {
    ...savedData[account.username],

    live: true,

    sessionId,

    lastRoomId:
      status.roomId || null,

    lastMessageId:
      message.id,

    offlineChecks: 0,

    pendingSessionId: null,

    announcedAt:
      message.createdAt.toISOString()
  };

  saveData();

  console.log(
    `[TikTok] ${account.displayName} LIVE! ` +

    `Announcement ${existing ? "reused" : "sent"}: ` +

    message.id
  );

  return message;
}

// ============================================================
// HANDLE OFFLINE STATUS
// ============================================================

function handleOffline(account) {
  const previous =
    savedData[account.username] || {};

  const count =
    Number(previous.offlineChecks || 0) + 1;

  const confirmed =
    count >= OFFLINE_CONFIRMATIONS;

  savedData[account.username] = {
    ...previous,

    offlineChecks:
      Math.min(
        count,
        OFFLINE_CONFIRMATIONS
      ),

    live:
      confirmed
        ? false
        : Boolean(previous.live),

    pendingSessionId:
      confirmed
        ? null
        : previous.pendingSessionId || null
  };

  if (
    confirmed &&
    previous.live
  ) {
    savedData[account.username].endedAt =
      new Date().toISOString();

    console.log(
      `[TikTok] ${account.displayName} ended their live.`
    );
  }

  saveData();
}

// ============================================================
// HANDLE LIVE STATUS
// ============================================================

async function handleLive(
  client,
  account,
  status
) {
  const previous =
    savedData[account.username] || {};

  const knownRoom =
    normalizeRoomId(
      previous.lastRoomId
    );

  const currentRoom =
    normalizeRoomId(
      status.roomId
    );

  // Already announced the same confirmed room.

  if (
    currentRoom &&
    knownRoom &&
    currentRoom === knownRoom
  ) {
    savedData[account.username] = {
      ...previous,

      live: true,

      offlineChecks: 0
    };

    saveData();

    console.log(
      `[TikTok] @${account.username} already announced this room.`
    );

    return;
  }

  // Still live but no room ID was returned.
  // Do not announce again until confirmed offline
  // or a different room is detected.

  if (
    previous.live &&
    previous.lastMessageId &&
    !currentRoom
  ) {
    savedData[account.username] = {
      ...previous,
      offlineChecks: 0
    };

    saveData();

    console.log(
      `[TikTok] @${account.username} remains live.`
    );

    return;
  }

  // Previously announced without a room ID.
  // A room ID becoming available is not necessarily
  // a brand-new livestream.

  if (
    previous.live &&
    previous.lastMessageId &&
    !knownRoom &&
    currentRoom
  ) {
    savedData[account.username] = {
      ...previous,

      live: true,

      lastRoomId:
        currentRoom,

      offlineChecks: 0
    };

    saveData();

    console.log(
      `[TikTok] @${account.username} existing room ID updated.`
    );

    return;
  }

  // New livestream.

  const sessionId =
    currentRoom ||

    previous.pendingSessionId ||

    `session-${randomUUID()}`;

  // Save the pending session before sending.
  // Allows retries without creating a different
  // session identifier every time.

  savedData[account.username] = {
    ...previous,

    pendingSessionId:
      sessionId,

    offlineChecks: 0
  };

  saveData();

  await sendLiveNotification(
    client,

    account,

    status,

    sessionId
  );
}

// ============================================================
// CHECK INDIVIDUAL ACCOUNT
// ============================================================

async function checkAccount(
  client,
  account
) {
  if (
    accountLocks.has(account.username)
  ) {
    return runtimeStatus.get(
      account.username
    ) || {
      state: "checking"
    };
  }

  accountLocks.add(
    account.username
  );

  console.log(
    `[TikTok] Checking @${account.username}...`
  );

  try {
    const status =
      await fetchLiveStatus(
        account
      );

    const result = {
      state:
        status.live ? "live" : "offline",

      roomId:
        status.roomId || null,

      source:
        status.source,

      checkedAt:
        new Date().toISOString()
    };

    runtimeStatus.set(
      account.username,
      result
    );

    console.log(
      `[TikTok] @${account.username}: ` +

      `${status.live ? "LIVE" : "OFFLINE"} ` +

      `| Method: ${status.source} ` +

      `| Room: ${status.roomId || "Unavailable"}`
    );

    if (!status.live) {
      handleOffline(account);

      return result;
    }

    try {
      await handleLive(
        client,
        account,
        status
      );

    } catch (error) {
      result.announcementError =
        safeError(error);

      console.error(
        `[TikTok] Announcement failed for @${account.username}:`,

        result.announcementError
      );
    }

    return result;

  } catch (error) {
    const previous =
      savedData[account.username];

    if (previous) {
      previous.offlineChecks = 0;
      saveData();
    }

    const result = {
      state: "unknown",

      error:
        safeError(error),

      checkedAt:
        new Date().toISOString()
    };

    runtimeStatus.set(
      account.username,
      result
    );

    console.error(
      `[TikTok] Detection failed for @${account.username}:`,

      result.error
    );

    // Do not mark the streamer offline
    // when TikTok returns an error.

    return result;

  } finally {
    accountLocks.delete(
      account.username
    );
  }
}

// ============================================================
// CHECK BOTH ACCOUNTS
// ============================================================

async function checkAllAccounts(client) {
  if (
    checking ||
    !client.isReady()
  ) {
    return;
  }

  checking = true;

  try {
    // Both accounts are checked independently.
    // One failed account does not disable the other.

    await Promise.allSettled(
      ACCOUNTS.map(
        async (account, index) => {
          if (index > 0) {
            await sleep(
              ACCOUNT_DELAY * index
            );
          }

          return checkAccount(
            client,
            account
          );
        }
      )
    );

  } finally {
    checking = false;
  }
}

// ============================================================
// AUTOMATIC MONITORING
// ============================================================

async function monitoringLoop(client) {
  try {
    if (client.isReady()) {
      await checkAllAccounts(
        client
      );
    }

  } catch (error) {
    console.error(
      "[TikTok] Monitoring error:",
      safeError(error)
    );

  } finally {
    // Schedule the next check only after
    // the previous cycle finishes.

    setTimeout(() => {
      void monitoringLoop(client);
    }, CHECK_INTERVAL);
  }
}

// ============================================================
// START MONITORING
// ============================================================

async function startMonitoring(client) {
  if (monitoringStarted) {
    return;
  }

  monitoringStarted = true;

  savedData = loadData();

  console.log(
    "[TikTok] ==================================="
  );

  console.log(
    "[TikTok] Chuppys live notification system started."
  );

  console.log(
    `[TikTok] Channel: ${LIVE_CHANNEL_ID}`
  );

  console.log(
    `[TikTok] Check delay: ${CHECK_INTERVAL / 1000} seconds`
  );

  console.log(
    `[TikTok] API key configured: ${
      process.env.TIKTOK_SIGN_API_KEY ||
      process.env.SIGN_API_KEY
        ? "YES"
        : "NO"
    }`
  );

  for (const account of ACCOUNTS) {
    console.log(
      `[TikTok] Monitoring @${account.username} (${account.displayName})`
    );
  }

  try {
    await getLiveChannel(
      client
    );

    console.log(
      "[TikTok] Discord announcement channel verified."
    );

  } catch (error) {
    console.error(
      "[TikTok] Channel verification failed:",
      safeError(error)
    );
  }

  try {
    await loadConnector();

  } catch (error) {
    console.error(
      "[TikTok] Connector loading failed:",
      safeError(error)
    );

    console.error(
      "[TikTok] Install a compatible tiktok-live-connector version."
    );
  }

  // Continue monitoring even if startup
  // encountered a temporary error.

  void monitoringLoop(client);
}

// ============================================================
// TEST LIVE ANNOUNCEMENT
// ============================================================
//
// ,testlive minitwxn
// ,testlive twxn
//
// Does not modify actual livestream tracking.
// ============================================================

async function testLiveAnnouncement(
  message,
  client,
  account
) {
  const channel =
    await getLiveChannel(client);

  const sent =
    await channel.send({
      embeds: [
        createLiveEmbed(
          account,
          true
        )
      ],

      components: [
        createLiveButton(
          account
        )
      ],

      allowedMentions: {
        parse: []
      }
    });

  console.log(
    `[TikTok] Test announcement sent: ${account.username}`
  );

  await message.reply({
    content:

      `Test announcement for **${account.displayName}** sent successfully!\n\n` +

      `[View Announcement](${sent.url})`,

    allowedMentions: {
      parse: [],
      repliedUser: false
    }
  });
}

// ============================================================
// MANUAL TIKTOK STATUS COMMAND
// ============================================================

async function showTikTokStatus(
  message,
  client
) {
  const notice =
    await message.reply({
      content:
        "Checking both TikTok accounts...",

      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    });

  const results =
    await Promise.all(
      ACCOUNTS.map(
        async (account, index) => {
          if (index > 0) {
            await sleep(
              ACCOUNT_DELAY * index
            );
          }

          const status =
            await checkAccount(
              client,
              account
            );

          return {
            account,
            status
          };
        }
      )
    );

  const embed = new EmbedBuilder()

    .setColor(EMBED_COLOR)

    .setTitle(
      "Chuppys TikTok Live Status"
    )

    .setThumbnail(
      THUMBNAIL_URL
    )

    .setFooter({
      text: FOOTER_TEXT
    })

    .setTimestamp();

  for (const result of results) {
    const { account, status } = result;

    const label =
      status.state === "live"

        ? "🟢 LIVE"

        : status.state === "offline"

          ? "⚫ OFFLINE"

          : status.state === "checking"

            ? "🟡 CHECKING"

            : "🔴 DETECTION ERROR";

    let value =

      `**Username:** @${account.username}\n` +

      `**Status:** ${label}\n`;

    if (status.roomId) {
      value +=
        `**Room:** ${status.roomId}\n`;
    }

    if (status.source) {
      value +=
        `**Method:** ${status.source}\n`;
    }

    if (status.error) {
      value +=
        `**Error:** ${status.error.slice(0, 350)}\n`;
    }

    if (status.announcementError) {
      value +=
        `**Discord Error:** ${status.announcementError.slice(0, 250)}\n`;
    }

    value +=
      `\n[Open TikTok](${account.liveUrl})`;

    embed.addFields({
      name:
        account.displayName,

      value:
        value.slice(0, 1024)
    });
  }

  embed.addFields({
    name:
      "Configuration",

    value:

      `**Announcement Channel:** <#${LIVE_CHANNEL_ID}>\n` +

      `**Check Delay:** ${CHECK_INTERVAL / 1000} seconds\n` +

      `**API Key:** ${
        process.env.TIKTOK_SIGN_API_KEY ||
        process.env.SIGN_API_KEY
          ? "Configured"
          : "Not configured"
      }`
  });

  await notice.edit({
    content: "",

    embeds: [
      embed
    ],

    allowedMentions: {
      parse: []
    }
  });
}

// ============================================================
// STAFF COMMAND LISTENER
// ============================================================

function installCommands(client) {
  client.on(
    Events.MessageCreate,

    async message => {
      if (
        !message.guild ||
        message.author.bot
      ) {
        return;
      }

      if (
        process.env.DISCORD_GUILD_ID &&
        message.guild.id !== process.env.DISCORD_GUILD_ID
      ) {
        return;
      }

      const raw =
        message.content.trim();

      const parts =
        raw.split(/\s+/);

      const command =
        parts[0]?.toLowerCase();

      if (
        command !== ",testlive" &&
        command !== ",tiktokstatus"
      ) {
        return;
      }

      if (
        !canManageTikTok(
          message.member
        )
      ) {
        return;
      }

      try {
        if (
          command === ",tiktokstatus"
        ) {
          return await showTikTokStatus(
            message,
            client
          );
        }

        if (
          command === ",testlive"
        ) {
          const account =
            getAccount(
              parts[1]
            );

          if (!account) {
            return message.reply({
              content:

                "**TikTok Test Commands**\n\n" +

                "`,testlive minitwxn`\n" +

                "`,testlive twxn`\n" +

                "`,tiktokstatus`",

              allowedMentions: {
                repliedUser: false
              }
            });
          }

          return await testLiveAnnouncement(
            message,

            client,

            account
          );
        }

      } catch (error) {
        console.error(
          "[TikTok] Command error:",
          safeError(error)
        );

        await message.reply({
          content:

            "TikTok error: " +

            safeError(error),

          allowedMentions: {
            parse: [],
            repliedUser: false
          }
        }).catch(() => {});
      }
    }
  );
}

// ============================================================
// INITIALIZE TIKTOK MODULE
// ============================================================

function setupTikTok(client) {
  if (!client) {
    throw new Error(
      "[TikTok] Discord client is required."
    );
  }

  if (
    initializedClients.has(client)
  ) {
    return;
  }

  initializedClients.add(
    client
  );

  installCommands(
    client
  );

  const start = () => {
    startMonitoring(client)
      .catch(error => {
        console.error(
          "[TikTok] Startup error:",

          safeError(error)
        );
      });
  };

  if (client.isReady()) {
    start();

  } else {
    client.once(
      Events.ClientReady,

      start
    );
  }

  console.log(
    "[TikTok] Notification module installed."
  );

  console.log(
    "[TikTok] ,testlive command installed."
  );

  console.log(
    "[TikTok] ,tiktokstatus command installed."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = setupTikTok;

module.exports.setupTikTok =
  setupTikTok;

// ============================================================
// END OF CHUPPYS TIKTOK.JS
// ============================================================
