# MK5 Dealer Intelligence transactional-email white-label overlay.
# Base image is intentionally pinned to the official Twenty v2.39.5 image.
FROM twentycrm/twenty:v2.39.5

USER root

# Copy only the compiled artifacts produced from the audited v2.39.5 source patch.
# Authentication paths, databases, environment variables, startup commands, and
# Twenty package/service names remain those of the official base image.
COPY --chown=node:node docker/runtime-overlay/email/index.js /app/packages/twenty-emails/dist/index.js
COPY --chown=node:node docker/runtime-overlay/email/index.mjs /app/packages/twenty-emails/dist/index.mjs
COPY --chown=node:node docker/runtime-overlay/server/workspace-invitation.service.js /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
COPY --chown=node:node docker/runtime-overlay/server/email-verification.service.js /app/packages/twenty-server/dist/engine/core-modules/email-verification/services/email-verification.service.js
COPY --chown=node:node docker/runtime-overlay/server/approved-access-domain.service.js /app/packages/twenty-server/dist/engine/core-modules/approved-access-domain/services/approved-access-domain.service.js
COPY --chown=node:node docker/mk5-dealer-intelligence-email-logo.png /app/packages/twenty-server/dist/front/images/branding/mk5-dealer-intelligence-email-logo.png
COPY --chown=node:node docker/verify-runtime-overlay.mjs /opt/mk5/verify-runtime-overlay.mjs

USER node
