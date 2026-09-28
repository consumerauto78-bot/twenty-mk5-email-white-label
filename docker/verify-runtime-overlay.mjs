import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const emailModule = await import('/app/packages/twenty-emails/dist/index.mjs');
const {
  PasswordResetLinkEmail,
  PasswordUpdateNotifyEmail,
  SendEmailVerificationLinkEmail,
  SendInviteLinkEmail,
  renderEmail,
} = emailModule;

const render = (component) => renderEmail(component);
const invitation = await render(
  SendInviteLinkEmail({
    link: 'https://example.test/invite?token=redacted',
    workspace: { name: 'MK5 Dealer Intelligence', logo: undefined },
    sender: {
      email: 'inviter@example.test',
      firstName: 'Inviter',
      lastName: 'Example',
    },
    serverUrl: 'https://example.test',
    locale: 'en',
  }),
);
const reset = await render(
  PasswordResetLinkEmail({
    duration: '24 hours',
    hasPassword: true,
    link: 'https://example.test/reset',
    locale: 'en',
  }),
);
const changed = await render(
  PasswordUpdateNotifyEmail({
    userName: 'Example',
    email: 'operator@example.test',
    link: 'https://example.test',
    locale: 'en',
  }),
);
const verification = await render(
  SendEmailVerificationLinkEmail({
    link: 'https://example.test/verify',
    locale: 'en',
  }),
);

for (const html of [invitation, reset, changed, verification]) {
  assert.match(html, /MK5 Dealer Intelligence/);
  assert.doesNotMatch(
    html,
    /app\.twenty\.com|twentyhq\/twenty|docs\.twenty\.com|Twenty logo/i,
  );
}
assert.match(invitation, /Accept Invitation/);
assert.match(
  invitation,
  /You(?:&apos;|&#x27;|')ve been invited to MK5 Dealer Intelligence/,
);
assert.doesNotMatch(invitation, /Join your team on Twenty|via Twenty|twenty\.com/i);
assert.match(changed, /Open MK5 Dealer Intelligence/);
assert.match(verification, /MK5 Dealer Intelligence/);
assert.match(invitation, /alt="MK5 Dealer Intelligence"/);
await stat(
  '/app/packages/twenty-server/dist/front/images/branding/mk5-dealer-intelligence-email-logo.png',
);

const invitationService = await readFile(
  '/app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js',
  'utf8',
);
const verificationService = await readFile(
  '/app/packages/twenty-server/dist/engine/core-modules/email-verification/services/email-verification.service.js',
  'utf8',
);
const approvedDomainService = await readFile(
  '/app/packages/twenty-server/dist/engine/core-modules/approved-access-domain/services/approved-access-domain.service.js',
  'utf8',
);
assert.match(invitationService, /You\\'re invited to MK5 Dealer Intelligence/);
assert.match(
  invitationService,
  /MK5 Dealer Intelligence <\$\{this\.twentyConfigService\.get\('EMAIL_FROM_ADDRESS'\)\}>/,
);
assert.doesNotMatch(invitationService, /Join your team on Twenty|\(via Twenty\)/);
assert.match(verificationService, /Please confirm your MK5 Dealer Intelligence email/);
assert.doesNotMatch(approvedDomainService, /\(via Twenty\)/);

console.log('PASS: pinned runtime overlay renders branded client emails and preserves branded sender paths');
