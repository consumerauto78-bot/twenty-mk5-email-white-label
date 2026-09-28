import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const inputRoot = process.argv[2] ?? '/tmp/mk5-runtime-overlay';
const outputRoot = process.argv[3] ?? '/tmp/mk5-runtime-overlay-patched';
const productName = 'MK5 Dealer Intelligence';
const productUrl = 'https://twenty-server-production-e6d4.up.railway.app';
const logoUrl = `${productUrl}/images/branding/mk5-dealer-intelligence-email-logo.png`;

const replaceExactly = (source, expected, replacement, label) => {
  const count = source.split(expected).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected one exact match, found ${count}`);
  }
  return source.replace(expected, replacement);
};

const replaceBetween = (source, start, end, replacement, label) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`${label}: bounded section was not found`);
  }
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
};

const helpersFor = (filename) =>
  filename.endsWith('.mjs')
    ? { jsx: 'jsx', jsxs: 'jsxs', fragment: 'Fragment$1' }
    : {
        jsx: '(0, react_jsx_runtime.jsx)',
        jsxs: '(0, react_jsx_runtime.jsxs)',
        fragment: 'react_jsx_runtime.Fragment',
      };

const patchEmailBundle = async (filename) => {
  const input = join(inputRoot, 'email', filename);
  const output = join(outputRoot, 'email', filename);
  await mkdir(dirname(output), { recursive: true });

  let source = await readFile(input, 'utf8');
  const { jsx, jsxs, fragment } = helpersFor(filename);

  source = replaceExactly(
    source,
    'children: "Twenty email"',
    'children: "MK5 Dealer Intelligence notification"',
    `${filename} document title`,
  );
  source = replaceExactly(
    source,
    'border: `1px solid ${canvasTheme.background.transparent.light}`,\n\tbackground: canvasTheme.background.button,\n\tboxShadow: `0px 2px 4px 0px ${canvasTheme.background.transparent.light}, 0px 0px 4px 0px ${canvasTheme.background.transparent.medium}`,',
    'border: "1px solid #0f2b43",\n\tbackground: "#163b5c",\n\tboxShadow: "0px 2px 4px 0px rgba(15, 43, 67, 0.2), 0px 0px 4px 0px rgba(15, 43, 67, 0.16)",',
    `${filename} CTA style`,
  );
  source = replaceExactly(
    source,
    'src: "https://app.twenty.com/images/icons/windows11/Square150x150Logo.scale-100.png",\n\t\talt: "Twenty logo",',
    `src: "${logoUrl}",\n\t\talt: "${productName}",`,
    `${filename} header logo`,
  );

  const footer = `var Footer = () => {\n\treturn /*#__PURE__*/ ${jsx}(Container, {\n\t\tstyle: footerContainerStyle,\n\t\tchildren: /*#__PURE__*/ ${jsx}(ShadowText, { children: /*#__PURE__*/ ${jsxs}(${fragment}, { children: [\n\t\t\t"${productName}",\n\t\t\t/*#__PURE__*/ ${jsx}("br", {}),\n\t\t\t"This is an automated account notification."\n\t\t] }) })\n\t});\n};\n`;
  source = replaceBetween(
    source,
    'var Footer =',
    '//#endregion\n//#region src/components/Logo.tsx',
    footer,
    `${filename} footer`,
  );

  const whatIs = `var WhatIsTwenty = () => {\n\treturn /*#__PURE__*/ ${jsxs}(${fragment}, { children: [\n\t\t/*#__PURE__*/ ${jsx}(SubTitle, { value: "About ${productName}" }),\n\t\t/*#__PURE__*/ ${jsx}(MainText, { children: "A purpose-built CRM workspace for dealer research, relationship intelligence, and opportunity management." })\n\t] });\n};\n`;
  source = replaceBetween(
    source,
    'var WhatIsTwenty =',
    '//#endregion\n//#region src/utils/capitalize.ts',
    whatIs,
    `${filename} product description`,
  );

  const invitation = `var SendInviteLinkEmail = ({ link, workspace, sender, serverUrl, locale }) => {\n\treturn /*#__PURE__*/ ${jsxs}(BaseEmail, {\n\t\twidth: 333,\n\t\tlocale,\n\t\tchildren: [\n\t\t\t/*#__PURE__*/ ${jsx}(Title, { value: "You've been invited to ${productName}" }),\n\t\t\t/*#__PURE__*/ ${jsx}(MainText, { children: "You've been invited to join the ${productName} platform. Use the button below to accept your invitation and set up your account." }),\n\t\t\t/*#__PURE__*/ ${jsxs}(HighlightedContainer, { children: [\n\t\t\t\t/*#__PURE__*/ ${jsx}(Img, { src: "${logoUrl}", width: 40, height: 40, alt: "${productName}" }),\n\t\t\t\tworkspace.name ? /*#__PURE__*/ ${jsx}(HighlightedText, { value: workspace.name }) : /*#__PURE__*/ ${jsx}(${fragment}, {}),\n\t\t\t\t/*#__PURE__*/ ${jsx}(CallToAction, { href: link, value: "Accept Invitation" })\n\t\t\t] })\n\t\t]\n\t});\n};\n`;
  source = replaceBetween(
    source,
    'var SendInviteLinkEmail =',
    'SendInviteLinkEmail.PreviewProps =',
    invitation,
    `${filename} invitation`,
  );

  source = replaceExactly(
    source,
    'value: i18n._("Connect to Twenty")',
    'value: "Open MK5 Dealer Intelligence"',
    `${filename} password update CTA`,
  );
  source = replaceExactly(
    source,
    '"We received a request to change the email address associated with your Twenty account. Click below to confirm this change." : "Thanks for registering for an account on Twenty! Before we get started, we just need to confirm that this is you. Click below to verify your email address."',
    '"We received a request to change the email address associated with your MK5 Dealer Intelligence account. Click below to confirm this change." : "Thanks for registering for MK5 Dealer Intelligence. Before we get started, please confirm that this is you."',
    `${filename} verification copy`,
  );
  source = replaceExactly(
    source,
    `/*#__PURE__*/ ${jsx}(MainText, { children: /*#__PURE__*/ ${jsx}(Trans, { id: bodyId }) })`,
    `/*#__PURE__*/ ${jsx}(MainText, { children: bodyId })`,
    `${filename} verification translation wrapper`,
  );

  await writeFile(output, source);
};

for (const filename of ['index.js', 'index.mjs']) {
  await patchEmailBundle(filename);
}

const patchServerFile = async (filename, edits) => {
  const input = join(inputRoot, 'server', filename);
  const output = join(outputRoot, 'server', filename);
  await mkdir(dirname(output), { recursive: true });
  let source = await readFile(input, 'utf8');
  for (const [expected, replacement, label] of edits) {
    source = replaceExactly(source, expected, replacement, label);
  }
  await writeFile(output, source);
};

await patchServerFile('workspace-invitation.service.js', [
  [
    'const joinTeamMsg = /*i18n*/ {\n                    id: "PviVyk",\n                    message: "Join your team on Twenty"\n                };\n                const i18n = this.i18nService.getI18nInstance(sender.locale);\n                const subject = i18n._(joinTeamMsg);',
    'const subject = "You\\\'re invited to MK5 Dealer Intelligence";',
    'workspace invitation subject',
  ],
  [
    'from: `${sender.name.firstName} ${sender.name.lastName} (via Twenty) <${this.twentyConfigService.get(\'EMAIL_FROM_ADDRESS\')}>`,',
    'from: `MK5 Dealer Intelligence <${this.twentyConfigService.get(\'EMAIL_FROM_ADDRESS\')}>`,',
    'workspace invitation sender',
  ],
]);

await patchServerFile('email-verification.service.js', [
  [
    'message: "Welcome to Twenty: Please Confirm Your Email"',
    'message: "Please confirm your MK5 Dealer Intelligence email"',
    'email verification signup subject',
  ],
]);

await patchServerFile('approved-access-domain.service.js', [
  [
    'from: `${sender.name.firstName} ${sender.name.lastName} (via Twenty) <${this.twentyConfigService.get(\'EMAIL_FROM_ADDRESS\')}>`,',
    'from: `MK5 Dealer Intelligence <${this.twentyConfigService.get(\'EMAIL_FROM_ADDRESS\')}>`,',
    'approved access domain sender',
  ],
]);

console.log(`Patched pinned runtime overlay from ${inputRoot} to ${outputRoot}`);
