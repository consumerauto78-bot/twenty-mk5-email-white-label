"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApprovedAccessDomainService", {
    enumerable: true,
    get: function() {
        return ApprovedAccessDomainService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _twentyemails = require("twenty-emails");
const _types = require("twenty-shared/types");
const _utils = require("twenty-shared/utils");
const _typeorm1 = require("typeorm");
const _approvedaccessdomainentity = require("../approved-access-domain.entity");
const _injectworkspacescopedrepositorydecorator = require("../../../twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator");
const _workspacescopedrepository = require("../../../twenty-orm/workspace-scoped-repository/workspace-scoped-repository");
const _approvedaccessdomainexception = require("../approved-access-domain.exception");
const _approvedaccessdomainvalidate = require("../approved-access-domain.validate");
const _jwttokentypeenum = require("../../auth/types/jwt-token-type.enum");
const _workspacedomainsservice = require("../../domain/workspace-domains/services/workspace-domains.service");
const _emailservice = require("../../email/email.service");
const _fileurlservice = require("../../file/file-url/file-url.service");
const _jwtwrapperservice = require("../../jwt/services/jwt-wrapper.service");
const _decodejwtheaderutil = require("../../jwt/utils/decode-jwt-header.util");
const _isasymmetricjwtheaderutil = require("../../jwt/utils/is-asymmetric-jwt-header.util");
const _twentyconfigservice = require("../../twenty-config/twenty-config.service");
const _getdomainfromemail = require("../../../../utils/get-domain-from-email");
const _isworkemail = require("../../../../utils/is-work-email");
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
const APPROVED_ACCESS_DOMAIN_TOKEN_EXPIRES_IN = '7d';
let ApprovedAccessDomainService = class ApprovedAccessDomainService {
    async sendApprovedAccessDomainValidationEmail(sender, to, workspace, approvedAccessDomain) {
        if (approvedAccessDomain.isValidated) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Approved access domain has already been validated', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_ALREADY_VERIFIED, {
                userFriendlyMessage: /*i18n*/ {
                    id: "BKvuAq",
                    message: "Approved access domain has already been validated"
                }
            });
        }
        if ((0, _getdomainfromemail.getDomainFromEmail)(to) !== approvedAccessDomain.domain) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Approved access domain does not match email domain', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_DOES_NOT_MATCH_DOMAIN_EMAIL, {
                userFriendlyMessage: /*i18n*/ {
                    id: "DGW5iN",
                    message: "Approved access domain does not match email domain"
                }
            });
        }
        const link = this.workspaceDomainsService.buildWorkspaceURL({
            workspace,
            pathname: (0, _utils.getSettingsPath)(_types.SettingsPath.WorkspaceMembersPage),
            searchParams: {
                wtdId: approvedAccessDomain.id,
                validationToken: await this.mintValidationToken({
                    approvedAccessDomain,
                    workspaceId: workspace.id
                })
            },
            hash: 'invite'
        });
        if (!(0, _utils.isDefined)(sender.userEmail)) {
            throw new Error(`Sender ${sender.id} has an empty userEmail`);
        }
        const logo = (0, _utils.isDefined)(workspace.logoFileId) ? await this.fileUrlService.signFileByIdUrl({
            fileId: workspace.logoFileId,
            workspaceId: workspace.id,
            fileFolder: _types.FileFolder.CorePicture
        }) : undefined;
        const emailTemplate = (0, _twentyemails.SendApprovedAccessDomainValidation)({
            link: link.toString(),
            workspace: {
                name: workspace.displayName,
                logo
            },
            domain: approvedAccessDomain.domain,
            sender: {
                email: sender.userEmail,
                firstName: sender.name.firstName,
                lastName: sender.name.lastName
            },
            serverUrl: this.twentyConfigService.get('SERVER_URL'),
            locale: sender.locale
        });
        const html = await (0, _twentyemails.renderEmail)(emailTemplate);
        const text = await (0, _twentyemails.renderEmail)(emailTemplate, {
            plainText: true
        });
        await this.emailService.send({
            from: `MK5 Dealer Intelligence <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
            to,
            subject: 'Approve your access domain',
            text,
            html
        });
    }
    async mintValidationToken({ approvedAccessDomain, workspaceId }) {
        return this.jwtWrapperService.signAsyncOrThrow({
            sub: approvedAccessDomain.id,
            type: _jwttokentypeenum.JwtTokenTypeEnum.APPROVED_ACCESS_DOMAIN,
            workspaceId,
            approvedAccessDomainId: approvedAccessDomain.id,
            domain: approvedAccessDomain.domain
        }, {
            expiresIn: APPROVED_ACCESS_DOMAIN_TOKEN_EXPIRES_IN
        });
    }
    async verifyValidationTokenOrThrow(validationToken) {
        if (!(0, _isasymmetricjwtheaderutil.isAsymmetricJwtHeader)((0, _decodejwtheaderutil.decodeJwtHeader)(validationToken))) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Invalid approved access domain validation token', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_VALIDATION_TOKEN_INVALID);
        }
        let payload;
        try {
            payload = await this.jwtWrapperService.verifyJwtToken(validationToken);
        } catch (error) {
            this.logger.warn(`Rejected approved-access-domain validation token: ${error instanceof Error ? error.message : 'unknown reason'}`);
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Invalid approved access domain validation token', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_VALIDATION_TOKEN_INVALID);
        }
        if (payload.type !== _jwttokentypeenum.JwtTokenTypeEnum.APPROVED_ACCESS_DOMAIN) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Invalid approved access domain validation token', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_VALIDATION_TOKEN_INVALID);
        }
        return payload;
    }
    async validateApprovedAccessDomain({ validationToken, approvedAccessDomainId }) {
        const payload = await this.verifyValidationTokenOrThrow(validationToken);
        if (payload.approvedAccessDomainId !== approvedAccessDomainId) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Invalid approved access domain validation token', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_VALIDATION_TOKEN_INVALID);
        }
        const approvedAccessDomain = await this.approvedAccessDomainRepositoryUnscoped.findOneBy({
            id: approvedAccessDomainId
        });
        _approvedaccessdomainvalidate.approvedAccessDomainValidator.assertIsDefinedOrThrow(approvedAccessDomain);
        if (payload.domain !== approvedAccessDomain.domain || payload.workspaceId !== approvedAccessDomain.workspaceId) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Invalid approved access domain validation token', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_VALIDATION_TOKEN_INVALID);
        }
        if (approvedAccessDomain.isValidated) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Approved access domain has already been validated', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_ALREADY_VALIDATED, {
                userFriendlyMessage: /*i18n*/ {
                    id: "BKvuAq",
                    message: "Approved access domain has already been validated"
                }
            });
        }
        await this.approvedAccessDomainRepository.update(approvedAccessDomain.workspaceId, {
            id: approvedAccessDomain.id
        }, {
            isValidated: true
        });
        return {
            ...approvedAccessDomain,
            isValidated: true
        };
    }
    async createApprovedAccessDomain(domain, inWorkspace, fromWorkspaceMember, emailToValidateDomain) {
        if (!(0, _isworkemail.isWorkDomain)(domain)) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Approved access domain must be a company domain', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_MUST_BE_A_COMPANY_DOMAIN);
        }
        const existing = await this.approvedAccessDomainRepository.findOne(inWorkspace.id, {
            where: {
                domain
            }
        });
        if (existing) {
            throw new _approvedaccessdomainexception.ApprovedAccessDomainException('Approved access domain already registered.', _approvedaccessdomainexception.ApprovedAccessDomainExceptionCode.APPROVED_ACCESS_DOMAIN_ALREADY_REGISTERED, {
                userFriendlyMessage: /*i18n*/ {
                    id: "mU5fvk",
                    message: "Approved access domain already registered."
                }
            });
        }
        const approvedAccessDomain = await this.approvedAccessDomainRepository.insertAndReturnOne(inWorkspace.id, {
            domain
        });
        await this.sendApprovedAccessDomainValidationEmail(fromWorkspaceMember, emailToValidateDomain, inWorkspace, approvedAccessDomain);
        return approvedAccessDomain;
    }
    async deleteApprovedAccessDomain(workspace, approvedAccessDomainId) {
        const approvedAccessDomain = await this.approvedAccessDomainRepository.findOne(workspace.id, {
            where: {
                id: approvedAccessDomainId
            }
        });
        _approvedaccessdomainvalidate.approvedAccessDomainValidator.assertIsDefinedOrThrow(approvedAccessDomain);
        await this.approvedAccessDomainRepository.delete(workspace.id, {
            id: approvedAccessDomain.id
        });
    }
    async getApprovedAccessDomains(workspace) {
        return this.approvedAccessDomainRepository.find(workspace.id);
    }
    async findValidatedApprovedAccessDomainWithWorkspacesAndSsoIdentityProvidersDomain(domain) {
        return this.approvedAccessDomainRepositoryUnscoped.find({
            relations: [
                'workspace',
                'workspace.workspaceSsoIdentityProviders',
                'workspace.approvedAccessDomains'
            ],
            where: {
                domain,
                isValidated: true
            }
        });
    }
    constructor(approvedAccessDomainRepository, // Cross-workspace lookups for token validation and SSO discovery.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    approvedAccessDomainRepositoryUnscoped, emailService, twentyConfigService, fileUrlService, workspaceDomainsService, jwtWrapperService){
        this.approvedAccessDomainRepository = approvedAccessDomainRepository;
        this.approvedAccessDomainRepositoryUnscoped = approvedAccessDomainRepositoryUnscoped;
        this.emailService = emailService;
        this.twentyConfigService = twentyConfigService;
        this.fileUrlService = fileUrlService;
        this.workspaceDomainsService = workspaceDomainsService;
        this.jwtWrapperService = jwtWrapperService;
        this.logger = new _common.Logger(ApprovedAccessDomainService.name);
    }
};
ApprovedAccessDomainService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _injectworkspacescopedrepositorydecorator.InjectWorkspaceScopedRepository)(_approvedaccessdomainentity.ApprovedAccessDomainEntity)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_approvedaccessdomainentity.ApprovedAccessDomainEntity)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _workspacescopedrepository.WorkspaceScopedRepository === "undefined" ? Object : _workspacescopedrepository.WorkspaceScopedRepository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _emailservice.EmailService === "undefined" ? Object : _emailservice.EmailService,
        typeof _twentyconfigservice.TwentyConfigService === "undefined" ? Object : _twentyconfigservice.TwentyConfigService,
        typeof _fileurlservice.FileUrlService === "undefined" ? Object : _fileurlservice.FileUrlService,
        typeof _workspacedomainsservice.WorkspaceDomainsService === "undefined" ? Object : _workspacedomainsservice.WorkspaceDomainsService,
        typeof _jwtwrapperservice.JwtWrapperService === "undefined" ? Object : _jwtwrapperservice.JwtWrapperService
    ])
], ApprovedAccessDomainService);

//# sourceMappingURL=approved-access-domain.service.js.map