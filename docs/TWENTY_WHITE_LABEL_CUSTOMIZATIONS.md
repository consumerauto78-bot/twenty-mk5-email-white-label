# MK5 Dealer Intelligence — Twenty Transactional Email White-Label Customization

## Scope and patch identity

- **Product-facing identity:** MK5 Dealer Intelligence
- **Underlying platform:** Twenty CRM
- **White-label patch base:** **Twenty v2.39.5**
- **Pinned upstream commit:** `032674e5298b905c69637649b4033203401016f6`
- **Customization scope:** Client-facing transactional-email presentation and sender display name only.
- **Out of scope:** Twenty package names, SDKs, CLI, APIs, database schema, internal identifiers, environment-variable names, authentication, authorization, invitation-token mechanics, password-reset mechanics, role assignment, session handling, and CRM records.

This is a deliberately small, version-pinned customization layer. It is **not** a broad Twenty fork.

## Centralized branding configuration

`packages/twenty-emails/src/config/mk5-email-branding.ts` is the single client-email branding source. It defines:

| Setting | Value / purpose |
|---|---|
| Product name | `MK5 Dealer Intelligence` |
| Application URL | Existing Railway host: `https://twenty-server-production-e6d4.up.railway.app` |
| Durable header-logo path | `/images/branding/mk5-dealer-intelligence-email-logo.png` |
| Invitation subject | `You're invited to MK5 Dealer Intelligence` |
| Invitation heading | `You've been invited to MK5 Dealer Intelligence` |
| Invitation CTA | `Accept Invitation` |
| Footer identity | `MK5 Dealer Intelligence` + `This is an automated account notification.` |

The public branding image is a 512 × 512 PNG copied into `packages/twenty-front/public/images/branding/`. The standard Twenty frontend build copies that file into the server’s static `dist/front` directory. Its resulting URL is HTTPS, public, stable at the existing Railway host, unauthenticated, and does **not** use a signed workspace-file URL or expand the security-sensitive file-token lifetime.

## Customized files and behavior

| Path | Purpose |
|---|---|
| `packages/twenty-emails/src/config/mk5-email-branding.ts` | Centralized client-email identity, application URL, durable-logo URL, invitation copy, and footer copy. |
| `packages/twenty-emails/src/components/BaseEmail.tsx` | Uses the simplified branded footer. |
| `packages/twenty-emails/src/components/BaseHead.tsx` | Changes the email document title from Twenty branding to an MK5 notification title. |
| `packages/twenty-emails/src/components/Logo.tsx` | Replaces the hard-coded Twenty logo with the durable MK5 PNG and the alt text `MK5 Dealer Intelligence`. |
| `packages/twenty-emails/src/components/Footer.tsx` | Replaces Twenty website, GitHub, documentation, developer links, and corporate footer with the minimal MK5 transactional footer. |
| `packages/twenty-emails/src/components/CallToAction.tsx` | Uses restrained MK5 navy/slate CTA styling without changing links or actions. |
| `packages/twenty-emails/src/components/WhatIsTwenty.tsx` | Replaces the client-visible generic Twenty product explanation with neutral MK5 Dealer Intelligence copy. The internal component name is deliberately retained. |
| `packages/twenty-emails/src/emails/send-invite-link.email.tsx` | Uses the approved invitation heading/body/CTA and durable header/context logo while preserving the supplied signed invitation URL. |
| `packages/twenty-emails/src/emails/password-reset-link.email.tsx` | Keeps the reset-token behavior intact; preview-only URL is changed to the Railway host. Shared header/footer apply the white-label identity. |
| `packages/twenty-emails/src/emails/password-update-notify.email.tsx` | Replaces the client CTA `Connect to Twenty` with `Open MK5 Dealer Intelligence`; no password behavior changes. |
| `packages/twenty-emails/src/emails/send-email-verification-link.email.tsx` | Replaces visible Twenty account language in signup/email-change verification content; does not enable verification or alter tokens. |
| `packages/twenty-emails/src/index.ts` | Exports the centralized branding constants for the existing server package. |
| `packages/twenty-server/src/engine/core-modules/workspace-invitation/services/workspace-invitation.service.ts` | Keeps invitation generation, expiration, role assignment, and token URL construction unchanged; changes only sender display name and subject to the centralized MK5 values. |
| `packages/twenty-server/src/engine/core-modules/email-verification/services/email-verification.service.ts` | Keeps verification-token generation and delivery semantics unchanged; changes only the ordinary signup subject. |
| `packages/twenty-server/src/engine/core-modules/approved-access-domain/services/approved-access-domain.service.ts` | Removes the remaining client-facing `(via Twenty)` sender display label. |
| `packages/twenty-front/public/images/branding/mk5-dealer-intelligence-email-logo.png` | Durable first-party public PNG used by transactional emails. |
| `packages/twenty-emails/scripts/verify-mk5-client-email-branding.mjs` | Renders invitation, password reset, password change, and verification templates and asserts required MK5 copy plus absence of Twenty branding URLs/text. |
| `packages/twenty-server/scripts/verify-mk5-invitation-sender.mjs` | Checks the client-facing invitation and access-domain sender/subject code paths for the centralized branding behavior. |

## Explicitly preserved authentication and access behavior

The patch does **not** alter:

- workspace invitation token creation, validation, invalidation, expiration, or signed links;
- password-reset token creation, validation, expiration, or signed links;
- email-verification token creation, validation, or current enablement state;
- workspace/user creation, role assignment, `Dealer Intelligence Operator` permissions, default role, sessions, or authorization;
- SMTP host, sender-domain address, or credential configuration;
- workspace logo metadata, database structure, CRM content, or imports.

The sender address remains the existing SMTP address. Only the display name becomes `MK5 Dealer Intelligence` for the scoped client-facing sender paths.

## Required verification

### Automated/rendering checks

Run after every rebase or upgrade:

```bash
source /home/ubuntu/.nvm/nvm.sh
nvm use 24
corepack yarn install --immutable
corepack yarn nx run twenty-emails:build
node packages/twenty-emails/scripts/verify-mk5-client-email-branding.mjs
node packages/twenty-server/scripts/verify-mk5-invitation-sender.mjs
git diff --check
```

The branding renderer verifies that the generated ordinary-client templates contain `MK5 Dealer Intelligence` and that the invitation contains `Accept Invitation`, but do not contain:

- `Join your team on Twenty`;
- `via Twenty`;
- `Twenty logo`;
- `twenty.com`, `app.twenty.com`, `twentyhq/twenty`, or Twenty documentation URLs.

### Required controlled live tests

Before calling the release fully accepted, use an approved internal/test mailbox only:

1. Invite the test user with the already-approved **Dealer Intelligence Operator** role.
2. Confirm the sender display name, subject, header/logo/alt text, heading, body, CTA, footer, and signed invitation action.
3. Accept the invitation, complete account setup, and confirm login and least-privilege Operator access.
4. Request a password reset and verify the branded message and valid reset flow.
5. Confirm a password-change notification and, if enabled in a future controlled test, verification/email-change messages.
6. Reconfirm existing administrator authentication and the Operator role matrix.

Never send test messages to a client address. If an approved test identity is unavailable, record **LIVE EMAIL QA BLOCKED — TEST IDENTITY REQUIRED** rather than improvising.

## Upgrade and rebase procedure

A Twenty upgrade must never silently overwrite this layer.

1. Identify the candidate upstream Twenty release and its immutable commit.
2. Clone/checkout that exact upstream version in a clean worktree.
3. Review upstream changes to every customized file listed above, especially shared email components and invitation/auth services.
4. Reapply the small customization patch manually or with `git apply`; resolve conflicts deliberately.
5. Update the patch-base version and commit in this document and in `mk5-email-branding.ts`.
6. Verify the durable static logo remains included by the frontend build and reachable at the intended HTTPS URL.
7. Run the automated/rendering checks above plus relevant Twenty email/authentication tests.
8. Use a non-production/test deployment where available to execute controlled invitation and password-reset regression tests.
9. Review the production diff, source offer, sender address, and rollback path.
10. Deploy server and worker together only after validation; monitor both for email/authentication errors.

## Rollback

This patch changes no database schema or CRM data. If a production invitation or authentication regression is observed:

1. Immediately redeploy both the Twenty Server and Twenty Worker from the prior approved `twentycrm/twenty:v2.39.5` deployment image/commit.
2. Confirm `/healthz`, existing administrator sign-in, and worker startup.
3. Do **not** retry client invitations until the failure is understood.
4. Preserve non-secret logs and the failed build identifier for diagnosis.
5. Re-run the controlled test sequence only after a corrected, reviewed patch is available.

The release record must capture the prior deployment identifier and the customized deployment identifier at deployment time.

## AGPL Section 13 and source availability

Twenty remains clearly identified internally as the underlying platform; upstream copyright notices and license files are not removed or rewritten.

Because a modified version is offered to users over a network, AGPLv3 Section 13 requires users interacting remotely with the modified version to be offered the complete corresponding source at no charge. For this narrow layer, the corresponding source offer must make available:

1. the exact upstream Twenty v2.39.5 source at commit `032674e5298b905c69637649b4033203401016f6`;
2. this complete white-label patch, including the branding asset and test scripts;
3. reproducible instructions to checkout the pinned upstream source and apply the patch; and
4. any scripts needed to build/run the modified version.

A public source-offer location must be finalized and linked prominently for network users **before or alongside production deployment**. A private repository alone is not a sufficient public source offer. The appropriate no-broad-fork approach is a small public patch repository that points to the exact public upstream source and includes the full patch plus reproducible application instructions. Do not portray the customized deployment as the official Twenty service.

## Secret handling

No credentials, tokens, SMTP passwords, Railway values, API keys, session data, or Docker data belong in this customization, the patch repository, screenshots, or documentation. The SMTP/mailbox password previously typed into chat remains a rotation item after final controlled email testing; its current value must never be retrieved or repeated.
