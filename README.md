# Wahlu CLI

Manage your social media from the terminal, or let your AI agent do it. The Wahlu CLI covers every
operation in the [Wahlu public API](https://wahlu.com/docs): discovery, brand context and labels,
media import, upload and repair, content, drafts, write-free preflight, and the full schedule
lifecycle, with schedules held for your review by default. It schedules to Instagram, Facebook,
TikTok, YouTube and LinkedIn.

Commands below are for version 0.4.0. It needs Node.js 20 or later.

## Install

```bash
npm install --global @wahlu/cli
wahlu --version
```

Or run it without installing:

```bash
npx -y @wahlu/cli auth status
```

Create an API key in the [Wahlu app](https://app.wahlu.com) under **Settings → API Keys**, then:

```bash
export WAHLU_API_KEY=your-key
wahlu auth status
```

## For AI agents

- **MCP:** most agents are better served by the Wahlu MCP server. See
  [wahlu.com/mcp](https://wahlu.com/mcp) for Claude, ChatGPT, Codex, Cursor, Gemini CLI and more.
- **Examples:** connect guides, example prompts, a Claude plugin and the OpenClaw skill live in
  [wahlu/agent-examples](https://github.com/wahlu/agent-examples).
- Agents should use `--json` and pass `--yes` only when you have approved a write.

The executable accepts API keys only through `WAHLU_API_KEY`. There is intentionally no
`--api-key` option, which avoids putting credentials into shell history or process listings.
Use a least-privilege, brand-restricted key where possible and never commit it to a project file.

## Command inventory

Every command maps to exactly one operation of the `@wahlu/api-client` SDK. `wahlu <group> --help`
and `wahlu <group> <command> --help` list every option.

```text
wahlu auth status
wahlu targets list --brand BRAND_ID
wahlu targets options --brand BRAND_ID --integration INTEGRATION_ID
wahlu targets refresh-options --brand BRAND_ID --integration INTEGRATION_ID [--yes]
wahlu platforms capabilities
wahlu brands context --brand BRAND_ID
wahlu brands labels --brand BRAND_ID
wahlu media import \
  --brand BRAND_ID \
  --url https://assets.example.com/campaign/hero.jpg \
  --idempotency-key KEY
wahlu media upload \
  --brand BRAND_ID \
  --file ./hero.jpg \
  --idempotency-key KEY
wahlu media list --brand BRAND_ID [--limit 12]
wahlu media get --brand BRAND_ID --media MEDIA_ID
wahlu media repair \
  --brand BRAND_ID \
  --media MEDIA_ID \
  --integration INTEGRATION_ID \
  --platform instagram \
  --post-type GRID_POST \
  --mode centre_crop \
  --repair-option REPAIR_OPTION_ID \
  --policy-version 2026-08-05.1 \
  --idempotency-key KEY
wahlu content list --brand BRAND_ID [--limit 20] [--cursor CURSOR] [--order desc]
wahlu content get --brand BRAND_ID --content-item CONTENT_ITEM_ID
wahlu drafts create \
  --brand BRAND_ID \
  --input-file ./draft.json \
  --idempotency-key KEY
wahlu drafts tiktok-privacy \
  --brand BRAND_ID \
  --content-item CONTENT_ITEM_ID \
  --integration TIKTOK_INTEGRATION_ID \
  --privacy-level SELF_ONLY [--yes]
wahlu drafts preflight \
  --brand BRAND_ID \
  --content-item CONTENT_ITEM_ID \
  --integration INTEGRATION_ID \
  [--scheduled-at 2026-10-20T09:00:00Z]
wahlu schedules list \
  --brand BRAND_ID \
  --from 2026-10-01T00:00:00Z \
  --to 2026-11-01T00:00:00Z
wahlu schedules create \
  --brand BRAND_ID \
  --content-item CONTENT_ITEM_ID \
  --scheduled-at 2026-10-20T09:00:00Z \
  --integration INTEGRATION_ID \
  --approval-status pending_review \
  --idempotency-key KEY
wahlu schedules get --brand BRAND_ID --schedule SCHEDULE_ID
wahlu schedules receipt --brand BRAND_ID --schedule SCHEDULE_ID
wahlu schedules cleanup \
  --brand BRAND_ID \
  --schedule SCHEDULE_ID \
  --input-file ./cleanup-authority.json \
  --idempotency-key KEY [--yes]
wahlu schedules reschedule \
  --brand BRAND_ID \
  --schedule SCHEDULE_ID \
  --scheduled-at 2026-10-21T09:00:00Z \
  --confirm-schedule SCHEDULE_ID \
  --idempotency-key KEY
wahlu schedules cancel \
  --brand BRAND_ID \
  --schedule SCHEDULE_ID \
  --confirm-schedule SCHEDULE_ID \
  --idempotency-key KEY [--yes]
```

This is all 24 public API operations.

### Discovery and brand context

- `auth status` shows the key, workspace, scopes and the brands it can reach. Take `BRAND_ID` from
  here.
- `brands context` returns what an agent needs before writing content: the brand's description,
  website, category and timezone, brand kit colours, fonts and logos, the owner's custom AI
  instructions, the Markdown brand profile and content strategy, the default call to action and
  Link in bio status. Human output summarises it; `--json` returns the full text.
- `brands labels` lists label IDs and names for a draft's `label_ids`.
- `targets list` reports each connected account and whether it can be scheduled. `targets options`
  reads a TikTok target's creator privacy levels and constraints; `targets refresh-options` asks
  TikTok again and may update stored credentials, so it needs confirmation.

### Media

- `media import` fetches a remote URL. `media upload` reads a local image or video, computes its
  size and SHA-256, opens an upload session and sends the exact bytes to the upload address Wahlu
  returns. The content type comes from the extension (`.jpg`, `.png`, `.gif`, `.webp`, `.mp4`,
  `.m4v`, `.mov`, `.webm`) unless you pass `--content-type`. Images can be up to 25 MiB and videos
  up to 500 MiB. If the upload is interrupted, re-run it with the same idempotency key.
- `media list` returns the most recent items (up to 24). `media get` reads one item's processing
  status once and does not poll.
- `media repair` creates a derivative from one repair option that preflight offered.

### Content and drafts

`content list` and `content get` read existing content items; `drafts` creates and changes them.

`drafts create` accepts the complete strict snake_case public draft body from exactly one source:

- `--input-file ./draft.json` reads a bounded UTF-8 file and keeps draft content out of the process
  argument list;
- `--input-json - < draft.json` reads bounded UTF-8 JSON from stdin; or
- `--input-json '{...}'` accepts inline JSON for convenience, but exposes that content to shell
  history and process inspection.

Supplying both input options, or neither, is a usage error. `--input-file -` is rejected so stdin
has one unambiguous spelling. Every JSON input is limited to 1 MiB; invalid UTF-8, unreadable files,
oversized input and invalid JSON fail before the API client is constructed. The idempotency key
must be supplied separately so retries have one explicit caller-owned source. Creating a draft never
schedules or publishes it.

`drafts tiktok-privacy` sets one TikTok target's privacy level on a draft, using a value from
`targets options`. `drafts preflight` (also available as `drafts validate`) is write-free and
reports blockers, warnings, repairs and next actions. Repeat `--integration` to evaluate several
intended accounts together; omit `--scheduled-at` when you want the API to report schedule-time
readiness as a repairable blocker.

### Schedules

`schedules create` requires the approval decision to be explicit. `pending_review` creates a held
Schedule and does not publish. `approved` may lead to publication and requires the API key to have
`publish:execute` permission. `schedules list` needs a date range of at most 93 days and pages with
`--cursor`. `schedules get` and `schedules receipt` read once and do not poll.

`schedules reschedule` and `schedules cancel` make you repeat the Schedule ID in
`--confirm-schedule`, as the API requires. `schedules cleanup` removes the provider posts of a
test-marked run: pass the receipt's `cleanup_authority` object, for example

```bash
wahlu schedules receipt --brand "$BRAND_ID" --schedule "$SCHEDULE_ID" --json \
  | jq '.data.cleanup_authority' > cleanup-authority.json
```

## Held Schedule golden workflow

This executable Bash example uses JSON output plus `jq` to carry every returned identifier into the
next command. It imports one Instagram grid image, reads media readiness once, and stops if
processing is not complete; it does not create a polling loop.

```bash
set -euo pipefail

CONTEXT_JSON=$(wahlu auth status --json)
BRAND_ID=$(jq -er '.data.brands[0].id' <<<"$CONTEXT_JSON")

TARGETS_JSON=$(wahlu targets list --brand "$BRAND_ID" --json)
INTEGRATION_ID=$(jq -er \
  '[.data.targets[] | select(.platform == "instagram" and .schedulable and .integration_id != null) | .integration_id][0]' \
  <<<"$TARGETS_JSON")

MEDIA_IMPORT_JSON=$(wahlu media import \
  --brand "$BRAND_ID" \
  --url "https://assets.example.com/campaign/instagram-grid.jpg" \
  --filename "instagram-grid.jpg" \
  --idempotency-key "media-instagram-grid-v1" \
  --json)
MEDIA_ID=$(jq -er '.data.id' <<<"$MEDIA_IMPORT_JSON")

MEDIA_JSON=$(wahlu media get --brand "$BRAND_ID" --media "$MEDIA_ID" --json)
if [[ $(jq -r '.data.status' <<<"$MEDIA_JSON") != "completed" ]]; then
  echo "Media $MEDIA_ID is not ready; run this workflow again later with the same idempotency keys."
  exit 1
fi

DRAFT_INPUT=$(jq -cn \
  --arg integration_id "$INTEGRATION_ID" \
  --arg media_id "$MEDIA_ID" \
  '{
    name: "Held Instagram launch",
    copy_mode: "single",
    single_copy: {caption: "Our launch is ready for review.", hashtags: ["launch"]},
    instagram_settings: {
      media_ids: [$media_id],
      post_type: "GRID_POST",
      collaborators: []
    },
    intended_integration_ids: [$integration_id]
  }')
DRAFT_JSON=$(wahlu drafts create \
  --brand "$BRAND_ID" \
  --input-json - \
  --idempotency-key "draft-instagram-launch-v1" \
  --json <<<"$DRAFT_INPUT")
CONTENT_ITEM_ID=$(jq -er '.data.content_item.id' <<<"$DRAFT_JSON")

SCHEDULED_AT="2026-11-02T10:00:00+11:00"
PREFLIGHT_JSON=$(wahlu drafts preflight \
  --brand "$BRAND_ID" \
  --content-item "$CONTENT_ITEM_ID" \
  --integration "$INTEGRATION_ID" \
  --scheduled-at "$SCHEDULED_AT" \
  --approval-status pending_review \
  --json)
jq -e '.data.can_schedule == true' <<<"$PREFLIGHT_JSON" >/dev/null

SCHEDULE_JSON=$(wahlu schedules create \
  --brand "$BRAND_ID" \
  --content-item "$CONTENT_ITEM_ID" \
  --integration "$INTEGRATION_ID" \
  --scheduled-at "$SCHEDULED_AT" \
  --approval-status pending_review \
  --idempotency-key "schedule-instagram-launch-v1" \
  --json)
SCHEDULE_ID=$(jq -er '.data.schedule.id' <<<"$SCHEDULE_JSON")

wahlu schedules get \
  --brand "$BRAND_ID" \
  --schedule "$SCHEDULE_ID" \
  --json
```

The final Schedule remains held for review with no publication effect. The variables
`BRAND_ID`, `INTEGRATION_ID`, `MEDIA_ID`, `CONTENT_ITEM_ID`, and `SCHEDULE_ID` are all sourced from
canonical command output rather than guessed.

## Global options

The following work consistently across commands and may appear before or after the command:

- `--json` emits one stable JSON success or failure document.
- `--timeout <milliseconds>` sets a positive finite logical-request timeout.
- `--base-url <url>` overrides the Wahlu API origin for staging or local development.
- `--media-base-url <url>` overrides the branded-media origin used to validate media responses.

`platforms capabilities` returns the canonical public post types, media and text rules, settings
fields, implementation status, and agent rules. JSON mode returns the complete typed registry;
human mode gives a compact publishing/scheduling overview.

Successful JSON preserves the API's canonical metadata exactly and keeps transport facts separate:

```json
{
	"ok": true,
	"command": "auth.status",
	"data": {},
	"meta": { "request_id": "request-id" },
	"transport": { "status": 200, "idempotency_replayed": false }
}
```

The CLI does not reconstruct pagination or request identity from deprecated aliases.

Production defaults remain `https://api.wahlu.com` and `https://media.wahlu.com`. Plain HTTP custom
origins are rejected by the shared client except for explicit loopback development addresses.

## Mutation safety

- Every write needs a caller-supplied idempotency key, an explicit confirmation, or both. The CLI
  never invents a key.
- Confirmation follows the API contract: a write with no idempotency key
  (`targets refresh-options`, `drafts tiktok-privacy`) or a high-risk write (`schedules cancel`,
  `schedules cleanup`) asks for a yes in an interactive terminal. Scripts and agents pass `--yes`.
  Without either, the command stops with `CONFIRMATION_REQUIRED` and makes no API call.
- Draft preflight is write-free. It cannot create a schedule, enqueue work or publish content.
- A `pending_review` Schedule is held and cannot publish. An `approved` Schedule may lead to an
  external publication and requires explicit `publish:execute` permission.
- JSON output for writes includes a `safety` object that states the effect, whether a Schedule was
  created and whether anything can publish.
- `--dry-run` deliberately returns a non-zero `DRY_RUN_UNSUPPORTED` result without calling the API.
  Wahlu does not yet expose a server-backed preview contract, so the CLI will not fake success.
- API failures stay failures and map to stable exit codes.

| Exit code | Meaning                                                            |
| --------: | ------------------------------------------------------------------ |
|         0 | Success                                                            |
|         2 | Usage, configuration, unsupported dry-run, or confirmation failure |
|         3 | Authentication                                                     |
|         4 | Permission                                                         |
|         5 | Not found                                                          |
|         6 | Validation                                                         |
|         7 | Conflict                                                           |
|         8 | Rate limit                                                         |
|         9 | Timeout or cancellation                                            |
|        10 | Network, redirect, oversized, or malformed response                |
|        11 | Server or unknown failure                                          |

## Not in the CLI

The CLI adds nothing the public API does not offer. There is no generic request command, no bulk
command and no polling loop. Editing or deleting drafts, queues, history and Link in bio are not in
the public API yet.

## About this repository

npm releases from 0.2 onwards are built from Wahlu's main codebase, so the source in this
repository is the original 0.1 CLI, kept for reference. Report problems or ask questions at
[hello@wahlu.com](mailto:hello@wahlu.com).

## Links

[Website](https://wahlu.com) · [MCP](https://wahlu.com/mcp) · [API docs](https://wahlu.com/docs) ·
[Agent examples](https://github.com/wahlu/agent-examples) · [npm](https://www.npmjs.com/package/@wahlu/cli)

## Licence

MIT. See [LICENSE](LICENSE).
