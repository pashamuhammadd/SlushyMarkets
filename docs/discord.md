# Discord

Plan and setup notes for the SlushyMarkets Discord server. The server is not linked from the
website yet: a public community link waits for Slushy's approval.

## Stage 1: feedback notifications (built)

Every feedback that is saved in Supabase is also posted to a private admin channel through a
Discord incoming webhook (`src/lib/server/discord.ts`).

- Sent: topic, rating, message, page, whether the visitor wants a reply.
- Never sent: the email address (it stays in Supabase only).
- User text cannot ping anyone (`allowed_mentions` is empty) and is cut to Discord limits.
- Sent after the response, so visitors never wait for Discord, and a Discord failure never
  turns a saved feedback into an error.

Setup:

1. In the Discord server, create a private channel, for example `#feedback-inbox`, visible only
   to the Admin role (channel settings, Permissions, turn off View Channel for `@everyone`, turn
   it on for Admin).
2. Channel settings, Integrations, Webhooks, New Webhook. Name it "SlushyMarkets Feedback" and
   copy the webhook URL. Treat it like a password.
3. In Vercel, Project, Settings, Environment Variables, add `DISCORD_FEEDBACK_WEBHOOK_URL` for
   Production (and Preview if wanted). Redeploy.
4. Send a test feedback on the website. A card appears in the channel.

If the URL leaks, delete the webhook in Discord and create a new one.

## Suggested server layout

| Category | Channels | Who sees it |
|---|---|---|
| Start here | `#welcome`, `#rules`, `#announcements` | Everyone, read only |
| Learn | `#lessons`, `#sound-playground`, `#questions` | Everyone |
| Community | `#general`, `#show-your-results` | Everyone |
| Team | `#feedback-inbox`, `#team-chat`, `#bot-logs` | Admin only |

Roles: Admin (Slushy, Nimia), Moderator, Member. Turn on Community features, the Welcome
Screen and Onboarding (Server Settings) for a welcome without any bot. Use AutoMod for spam and
invite links.

## Stage 2: SlushyMarkets bot (planned)

Slash commands served by the website on Vercel through Discord's HTTP interactions endpoint, so
no extra server is needed: `/lesson`, `/playground`, `/glossary <term>`, `/feedback`. Needs a
Discord application (Developer Portal) and its public key and bot token in Vercel.

## Stage 3: welcome messages and other live bots (later)

Reacting to members joining needs a bot that stays connected all the time, which Vercel cannot
host. Until then, Discord's own Welcome Screen, Onboarding and system welcome messages cover it.
