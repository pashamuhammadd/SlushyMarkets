# Admin dashboard and community: roadmap

Status: planning only. No admin route and no Discord server exist.

## Admin audit

- Data today: only the `feedback` table in Supabase, written server side.
- There is no analytics system in the repo, so the dashboard must not show visitor statistics until one is installed.
- There are no experiment results yet, because the research experiment is not built.

## Admin design

1. Route `/admin` plus `/api/admin/*`, with every request authorized on the server. Hiding a menu is not protection.
2. Supabase service key used only on the server. Row Level Security stays on, with no public read policy.
3. Order of work: login, read only feedback list, status and delete actions, CSV export, research overview.
4. Blocker: choose the auth method (Supabase Auth with one allowed email is recommended, since it adds no new service) and who holds the account.

## Community (future, not approved in detail)

Candidate domain: community.slushymarkets.com. Planned parts: user accounts, posts, comments, likes, bookmarks, notifications, moderation, Discord webhook.

- Slushy must create and own any Discord server.
- Webhook URLs are server side secrets.
- Discord notifications carry no email or personal data unless there is a clear basis and consent.
- Moderation and a reporting path come before public posting.
