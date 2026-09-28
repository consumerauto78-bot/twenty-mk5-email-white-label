"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EmailVerificationService", {
    enumerable: true,
    get: function() {
        return EmailVerificationService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _datefns = require("date-fns");
const _ms = /*#__PURE__*/ _interop_require_default(require("ms"));
const _twentyemails = require("twenty-emails");
const _types = require("twenty-shared/types");
const _utils = require("twenty-shared/utils");
const _typeorm1 = require("typeorm");
const _apptokenentity = require("../../app-token/app-token.entity");
const _emailverificationtokenservice = require("../../auth/token/services/email-verification-token.service");
const _domainserverconfigservice = require("../../domain/domain-server-config/services/domain-server-config.service");
const _workspacedomainsservice = require("../../domain/workspace-domains/services/workspace-domains.service");
const _emailverificationconstants = require("../email-verification.constants");
const _emailverificationexception = require("../email-verification.exception");
const _emailservice = require("../../email/email.service");
const _i18nservice = require("../../i18n/i18n.service");
const _twentyconfigservice = require("../../twenty-config/twenty-config.service");
const _userentity = require("../../user/user.entity");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let EmailVerificationService = class EmailVerificationService {
    async sendVerificationEmail({ userId, email, workspace, locale, verifyEmailRedirectPath, verificationTrigger = _emailverificationconstants.EmailVerificationTrigger.SIGN_UP }) {
        if (!this.twentyConfigService.get('IS_EMAIL_VERIFICATION_REQUIRED')) {
            return {
                success: false
            };
        }
        const { token: emailVerificationToken } = await this.emailVerificationTokenService.generateToken(userId, email);
        const linkPathnameAndSearchParams = {
            pathname: _types.AppPath.VerifyEmail,
            searchParams: {
                emailVerificationToken,
                email,
                ...(0, _utils.isDefined)(verifyEmailRedirectPath) ? {
                    nextPath: verifyEmailRedirectPath
                } : {}
            }
        };
        const verificationLink = workspace ? this.workspaceDomainsService.buildWorkspaceURL({
            workspace,
            ...linkPathnameAndSearchParams
        }) : this.domainsServerConfigService.buildBaseUrl(linkPathnameAndSearchParams);
        const emailData = {
            link: verificationLink.toString(),
            locale,
            isEmailUpdate: verificationTrigger === _emailverificationconstants.EmailVerificationTrigger.EMAIL_UPDATE
        };
        const emailTemplate = (0, _twentyemails.SendEmailVerificationLinkEmail)(emailData);
        const html = await (0, _twentyemails.renderEmail)(emailTemplate);
        const text = await (0, _twentyemails.renderEmail)(emailTemplate, {
            plainText: true
        });
        const emailVerificationMsg = verificationTrigger === _emailverificationconstants.EmailVerificationTrigger.EMAIL_UPDATE ? /*i18n*/ {
            id: "mqzu5F",
            message: "Please confirm your updated email"
        } : /*i18n*/ {
            id: "TVkCrJ",
            message: "Please confirm your MK5 Dealer Intelligence email"
        };
        const i18n = this.i18nService.getI18nInstance(locale);
        const subject = i18n._(emailVerificationMsg);
        await this.emailService.send({
            from: `${this.twentyConfigService.get('EMAIL_FROM_NAME')} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
            to: email,
            subject,
            text,
            html
        });
        return {
            success: true
        };
    }
    async resendEmailVerificationToken(email, workspace, locale) {
        if (!this.twentyConfigService.get('IS_EMAIL_VERIFICATION_REQUIRED')) {
            throw new _emailverificationexception.EmailVerificationException('Email verification token cannot be sent because email verification is not required', _emailverificationexception.EmailVerificationExceptionCode.EMAIL_VERIFICATION_NOT_REQUIRED);
        }
        // TODO: Remove the dependency on querying user altogether when the endpoint is authenticated.
        const user = await this.userRepository.findOne({
            where: {
                email
            }
        });
        (0, _utils.assertIsDefinedOrThrow)(user);
        if (user.isEmailVerified) {
            throw new _emailverificationexception.EmailVerificationException('Email already verified', _emailverificationexception.EmailVerificationExceptionCode.EMAIL_ALREADY_VERIFIED);
        }
        const existingToken = await this.appTokenRepository.findOne({
            where: {
                userId: user.id,
                type: _apptokenentity.AppTokenType.EmailVerificationToken
            }
        });
        if (existingToken) {
            const cooldownDuration = (0, _ms.default)('1m');
            const timeToWaitMs = (0, _datefns.differenceInMilliseconds)((0, _datefns.addMilliseconds)(existingToken.createdAt, cooldownDuration), new Date());
            if (timeToWaitMs > 0) {
                throw new _emailverificationexception.EmailVerificationException(`Please wait ${(0, _ms.default)(timeToWaitMs, {
                    long: true
                })} before requesting another verification email`, _emailverificationexception.EmailVerificationExceptionCode.RATE_LIMIT_EXCEEDED);
            }
            await this.appTokenRepository.delete(existingToken.id);
        }
        await this.sendVerificationEmail({
            userId: user.id,
            email,
            workspace,
            locale,
            verificationTrigger: _emailverificationconstants.EmailVerificationTrigger.SIGN_UP
        });
        return {
            success: true
        };
    }
    constructor(appTokenRepository, userRepository, workspaceDomainsService, domainsServerConfigService, emailService, twentyConfigService, emailVerificationTokenService, i18nService){
        this.appTokenRepository = appTokenRepository;
        this.userRepository = userRepository;
        this.workspaceDomainsService = workspaceDomainsService;
        this.domainsServerConfigService = domainsServerConfigService;
        this.emailService = emailService;
        this.twentyConfigService = twentyConfigService;
        this.emailVerificationTokenService = emailVerificationTokenService;
        this.i18nService = i18nService;
    }
};
EmailVerificationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_apptokenentity.AppTokenEntity)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_userentity.UserEntity)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _workspacedomainsservice.WorkspaceDomainsService === "undefined" ? Object : _workspacedomainsservice.WorkspaceDomainsService,
        typeof _domainserverconfigservice.DomainServerConfigService === "undefined" ? Object : _domainserverconfigservice.DomainServerConfigService,
        typeof _emailservice.EmailService === "undefined" ? Object : _emailservice.EmailService,
        typeof _twentyconfigservice.TwentyConfigService === "undefined" ? Object : _twentyconfigservice.TwentyConfigService,
        typeof _emailverificationtokenservice.EmailVerificationTokenService === "undefined" ? Object : _emailverificationtokenservice.EmailVerificationTokenService,
        typeof _i18nservice.I18nService === "undefined" ? Object : _i18nservice.I18nService
    ])
], EmailVerificationService);

//# sourceMappingURL=email-verification.service.js.map