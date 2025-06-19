
Hooks.once("init", () => {
  game.settings.register("auto-unfollow-followme", "enableCombatStop", {
    name: "Stop Following on Combat Start",
    hint: "Automatically disables follow when combat starts.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register("auto-unfollow-followme", "enableTeleportStop", {
    name: "Stop Following on Teleport",
    hint: "Automatically disables follow if token teleports (moves over 60ft).",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register("auto-unfollow-followme", "notifyGM", {
    name: "Notify GM on Auto-Unfollow",
    hint: "If enabled, sends a whisper to the GM when a character is auto-unfollowed.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
});

Hooks.on("combatStart", () => {
  if (!game.settings.get("auto-unfollow-followme", "enableCombatStop")) return;
  for (const token of canvas.tokens.placeables) {
    const isFollowing = token.document.getFlag("FollowMe", "following");
    if (isFollowing) {
      token.document.unsetFlag("FollowMe", "following");
      if (game.settings.get("auto-unfollow-followme", "notifyGM")) {
        ChatMessage.create({
          content: `<strong>${token.name}</strong> auto-stopped following on combat start.`,
          whisper: ChatMessage.getWhisperRecipients("GM")
        });
      }
    }
  }
});

Hooks.on("updateToken", async (doc, change) => {
  if (!game.settings.get("auto-unfollow-followme", "enableTeleportStop")) return;
  if (!("x" in change || "y" in change)) return;

  const prev = { x: doc.x, y: doc.y };
  const newX = change.x ?? doc.x;
  const newY = change.y ?? doc.y;
  const distance = canvas.grid.measureDistance(prev, { x: newX, y: newY });

  if (distance > 60) {
    const isFollowing = doc.getFlag("FollowMe", "following");
    if (isFollowing) {
      await doc.unsetFlag("FollowMe", "following");
      if (game.settings.get("auto-unfollow-followme", "notifyGM")) {
        ChatMessage.create({
          content: `<strong>${doc.name}</strong> auto-stopped following due to teleport.`,
          whisper: ChatMessage.getWhisperRecipients("GM")
        });
      }
    }
  }
});
