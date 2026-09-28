# MK5 Dealer Intelligence — Twenty Transactional Email White-Label Patch

> **Scope:** client-facing transactional-email presentation and sender display names for MK5 Dealer Intelligence. This repository is a small, version-pinned patch and runtime overlay; it is **not** a Twenty fork.

## Exact upstream base

| Item | Value |
|---|---|
| Upstream project | [twentyhq/twenty](https://github.com/twentyhq/twenty) |
| Upstream release | `Twenty v2.39.5` |
| Immutable upstream commit | `032674e5298b905c69637649b4033203401016f6` |
| Official runtime image | `twentycrm/twenty:v2.39.5` |
| Customization identity | `MK5 Dealer Intelligence` |

The underlying software remains **Twenty CRM**. Internal Twenty package names, APIs, SDKs, database structures, authentication mechanics, authorization, roles, sessions, token generation, and environment variables are intentionally unchanged.

## What changes

The version-pinned source patch:

- replaces the hard-coded Twenty email header logo with a first-party, durable MK5 PNG;
- removes the Twenty promotional footer and its website, GitHub, documentation, and developer links;
- updates the ordinary invitation sender display name, subject, heading, body, CTA, image alt text, and footer;
- uses restrained navy/slate CTA styling;
- removes ordinary-client Twenty copy from password-change and email-verification emails;
- leaves signed invitation/reset/verification actions, expiration, and security behavior intact; and
- adds focused rendering and sender-path checks.

It does **not** change the sender email address/domain, SMTP configuration, database content, operator permissions, authentication routes, account/role assignment, or any application feature outside the scoped client-facing email presentation.

## Source offer and AGPLv3 Section 13

This repository provides the complete corresponding source for the MK5 transactional-email customization when it is offered as a network service:

1. the exact public upstream source identified above;
2. [`PATCHES/mk5-transactional-email-branding-v2.39.5.patch`](PATCHES/mk5-transactional-email-branding-v2.39.5.patch), which contains every source modification, test, documentation file, and branding asset;
3. this small derived runtime overlay, including the reproducible overlay generator; and
4. build, verification, upgrade, and rollback guidance in [`docs/TWENTY_WHITE_LABEL_CUSTOMIZATIONS.md`](docs/TWENTY_WHITE_LABEL_CUSTOMIZATIONS.md).

The upstream AGPL license is preserved verbatim in [`LICENSE`](LICENSE). This project does not claim to be the official Twenty service.

## Reproducing the patched source

```bash
git clone https://github.com/twentyhq/twenty.git twenty-upstream
cd twenty-upstream
git checkout 032674e5298b905c69637649b4033203401016f6
git apply /path/to/mk5-transactional-email-branding-v2.39.5.patch

source /home/ubuntu/.nvm/nvm.sh
nvm use 24
corepack yarn install --immutable
corepack yarn nx run twenty-emails:build
node packages/twenty-emails/scripts/verify-mk5-client-email-branding.mjs
node packages/twenty-server/scripts/verify-mk5-invitation-sender.mjs
```

The patch is intentionally limited to the files documented in the customization guide. It does not require or include any credential, token, SMTP password, Railway configuration, session information, or CRM data.

## Building the small production overlay

The root [`Dockerfile`](Dockerfile) layers only six audited runtime artifacts over the official `twentycrm/twenty:v2.39.5` image: the compiled email module (CJS and ESM), three compiled sender services, and the public MK5 logo. The checked-in `docker/runtime-overlay/` artifacts are generated deterministically by `docker/apply-runtime-overlay.mjs` from the official pinned runtime’s corresponding files.

```bash
docker build -t ghcr.io/consumerauto78-bot/twenty-mk5-email-white-label:2.39.5-mk5.1 .
docker run --rm \
  --entrypoint node \
  ghcr.io/consumerauto78-bot/twenty-mk5-email-white-label:2.39.5-mk5.1 \
  /opt/mk5/verify-runtime-overlay.mjs
```

The runtime verifier renders ordinary invitation, password-reset, password-change, and email-verification templates without sending mail. It validates the subject/sender code paths and confirms the durable logo is present in the server’s public static directory.

## Release guardrails

- Retain the existing Railway host and SMTP sender domain in this phase.
- Do not deploy without a successful runtime verifier run.
- Deploy the same validated image tag to both the Twenty Server and Twenty Worker services.
- Use an approved internal/test mailbox—not a client address—for live invitation and password-reset regression testing.
- If authentication, invitation acceptance, or existing-user access regresses, immediately redeploy the prior official `twentycrm/twenty:v2.39.5` image.
- Rotate the SMTP/mailbox password after final controlled testing because an earlier password was entered in chat; never add it to this repository.

## Upgrade procedure

Follow the detailed procedure in [`docs/TWENTY_WHITE_LABEL_CUSTOMIZATIONS.md`](docs/TWENTY_WHITE_LABEL_CUSTOMIZATIONS.md). Every Twenty upgrade requires a fresh review/rebase of the patched email components and sender services, successful source/render checks, controlled non-production live testing, and a new immutable release tag. Never allow an upstream image upgrade to overwrite the customization silently.

## Integrity

`CHECKSUMS.sha256` covers the authoritative source patch and branding asset. Regenerate it only as part of a reviewed release after checking the full diff and test results.
