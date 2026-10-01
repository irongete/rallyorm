import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for User
 */
export class User extends RallyEntity {

    declare VsiAdmin?: boolean;
    declare OverrideSSORedirect?: string | null;
    declare LastActiveDate?: string | Date | null;
    declare Language?: "US English" | (string & {});
    declare Locale?: "US English" | (string & {});
    declare EmailNotificationEnabled?: boolean;
    declare PasswordExpires?: number | null;
    declare DefaultDetailPageToViewingMode?: boolean;
    declare DateTimeFormat?: "" | "yyyy-MM-dd hh:mm a z" | "MM/dd/yyyy hh:mm a z" | "dd/MM/yyyy hh:mm a z" | "yyyy/MM/dd hh:mm a z" | "yyyy-MMM-dd hh:mm a z" | "yyyy-MM-dd HH:mm z" | "MM/dd/yyyy HH:mm z" | "dd/MM/yyyy HH:mm z" | "yyyy/MM/dd HH:mm z" | "yyyy-MMM-dd HH:mm z" | "yyyy-MM-dd z" | "MM/dd/yyyy z" | "dd/MM/yyyy z" | "yyyy/MM/dd z" | "yyyy-MMM-dd z" | "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy/MM/dd" | "yyyy-MMM-dd" | (string & {}) | null;
    declare DateFormat?: "" | "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy/MM/dd" | "yyyy-MMM-dd" | (string & {}) | null;
    declare SessionTimeoutWarning?: boolean;
    declare ProjectScopeDown?: boolean;
    declare ProjectScopeUp?: boolean;
    declare FailedLoginAttempts?: number | null;
    declare isonSSOExceptionList?: boolean;
    declare sessionTimeout?: number;
    declare Deleted?: boolean;
    declare AccountLockedUntil?: string | Date | null;
    declare IsSLMAdmin?: boolean;
    declare IsProvisioningUser?: boolean;
    declare LastSystemTimeZoneName?: string | null;
    declare InvestmentAdmin?: boolean;
    declare SubscriptionPermission?: "No Access" | "Workspace User" | "Project Admin" | "Workspace Admin" | "Subscription Admin" | (string & {}) | null;
    declare WorkspacePermission?: "No Access" | "Workspace User" | "Project Admin" | "Workspace Admin" | "Subscription Admin" | (string & {}) | null;
    declare Planner?: boolean;
    declare ObjectUUID?: string;
    declare TimeboxAdmin?: boolean;
    declare CanCreateOAuthClient?: boolean;
    declare CanCreateApiKey?: boolean;
    declare WidgetDeveloper?: boolean;
    declare OkrAdmin?: boolean;
    declare LdapUuid?: string | null;
    declare subscriptionOid?: number;
    declare ZuulID?: string | null;
    declare SubscriptionID?: number;
    declare LastLoginDate?: string | Date | null;
    declare CostCenter?: string | null;
    declare OfficeLocation?: string | null;
    declare Department?: string | null;
    declare NetworkID?: string | null;
    declare Phone?: string | null;
    declare SubscriptionAdmin?: boolean;
    declare LandingPage?: string | null;
    declare OnpremLdapUsername?: string | null;
    declare UserName?: string;
    declare Role?: "" | "None" | "Product Owner" | "Scrum Master" | "Architect" | "Developer" | "Tester" | "Technical Writer" | "User Experience" | (string & {}) | null;
    declare Disabled?: boolean;
    declare EmailAddress?: string;
    declare LastPasswordUpdateDate?: string | Date;
    declare ShortDisplayName?: string | null;
    declare DisplayName?: string | null;
    declare MiddleName?: string | null;
    declare LastName?: string | null;
    declare FirstName?: string | null;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare ArtifactsCreated?: any[];
    declare ArtifactsOwned?: any[];
    declare ProfileImage?: any;
    declare DefaultProject?: any;
    declare TeamMemberships?: any[];
    declare RevisionHistory?: any;
    declare UserPermissions?: any[];
    declare UserProfile?: any;
    declare Subscription?: any;

    static override readonly entityType = 'user';

    static override readonly fields = {
        VsiAdmin: { type: 'boolean' },
        OverrideSSORedirect: { type: 'string', readOnly: true, maxLength: 2048, filterable: false, sortable: false },
        LastActiveDate: { type: 'date', readOnly: true },
        Language: { type: 'string', required: true, maxLength: 128, enum: ['US English'], filterable: false, sortable: false },
        Locale: { type: 'string', required: true, maxLength: 128, enum: ['US English'], filterable: false, sortable: false },
        EmailNotificationEnabled: { type: 'boolean', filterable: false, sortable: false },
        PasswordExpires: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        DefaultDetailPageToViewingMode: { type: 'boolean', filterable: false, sortable: false },
        DateTimeFormat: { type: 'string', maxLength: 128, enum: ['', 'yyyy-MM-dd hh:mm a z', 'MM/dd/yyyy hh:mm a z', 'dd/MM/yyyy hh:mm a z', 'yyyy/MM/dd hh:mm a z', 'yyyy-MMM-dd hh:mm a z', 'yyyy-MM-dd HH:mm z', 'MM/dd/yyyy HH:mm z', 'dd/MM/yyyy HH:mm z', 'yyyy/MM/dd HH:mm z', 'yyyy-MMM-dd HH:mm z', 'yyyy-MM-dd z', 'MM/dd/yyyy z', 'dd/MM/yyyy z', 'yyyy/MM/dd z', 'yyyy-MMM-dd z', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'], filterable: false, sortable: false },
        DateFormat: { type: 'string', maxLength: 128, enum: ['', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'], filterable: false, sortable: false },
        SessionTimeoutWarning: { type: 'boolean', filterable: false, sortable: false },
        ProjectScopeDown: { type: 'boolean', filterable: false, sortable: false },
        ProjectScopeUp: { type: 'boolean', filterable: false, sortable: false },
        FailedLoginAttempts: { type: 'integer', readOnly: true },
        isonSSOExceptionList: { type: 'boolean', readOnly: true },
        sessionTimeout: { type: 'integer', required: true, filterable: false, sortable: false },
        Deleted: { type: 'boolean', readOnly: true },
        AccountLockedUntil: { type: 'date', readOnly: true },
        IsSLMAdmin: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        IsProvisioningUser: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        LastSystemTimeZoneName: { type: 'string', maxLength: 128 },
        InvestmentAdmin: { type: 'boolean', filterable: false },
        SubscriptionPermission: { type: 'string', readOnly: true, maxLength: 32, enum: ['No Access', 'Workspace User', 'Project Admin', 'Workspace Admin', 'Subscription Admin'], sortable: false },
        WorkspacePermission: { type: 'string', readOnly: true, maxLength: 32, enum: ['No Access', 'Workspace User', 'Project Admin', 'Workspace Admin', 'Subscription Admin'], sortable: false },
        Planner: { type: 'boolean', filterable: false },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        TimeboxAdmin: { type: 'boolean', readOnly: true },
        CanCreateOAuthClient: { type: 'boolean' },
        CanCreateApiKey: { type: 'boolean' },
        WidgetDeveloper: { type: 'boolean' },
        OkrAdmin: { type: 'boolean' },
        LdapUuid: { type: 'string', hidden: true, maxLength: 36 },
        subscriptionOid: { type: 'integer', required: true, readOnly: true },
        ZuulID: { type: 'string', readOnly: true, sortable: false },
        SubscriptionID: { type: 'integer', required: true, readOnly: true },
        LastLoginDate: { type: 'date', readOnly: true },
        CostCenter: { type: 'string', maxLength: 255 },
        OfficeLocation: { type: 'string', maxLength: 255 },
        Department: { type: 'string', maxLength: 255 },
        NetworkID: { type: 'string', maxLength: 255 },
        Phone: { type: 'string', maxLength: 128 },
        SubscriptionAdmin: { type: 'boolean', readOnly: true, filterable: false },
        LandingPage: { type: 'string', readOnly: true, maxLength: 256, filterable: false, sortable: false },
        OnpremLdapUsername: { type: 'string', maxLength: 254 },
        UserName: { type: 'string', required: true, maxLength: 254 },
        Role: { type: 'string', maxLength: 128, enum: ['', 'None', 'Product Owner', 'Scrum Master', 'Architect', 'Developer', 'Tester', 'Technical Writer', 'User Experience'] },
        Disabled: { type: 'boolean' },
        EmailAddress: { type: 'string', required: true, maxLength: 254 },
        LastPasswordUpdateDate: { type: 'date', required: true, readOnly: true },
        ShortDisplayName: { type: 'string', maxLength: 24 },
        DisplayName: { type: 'string', maxLength: 254 },
        MiddleName: { type: 'string', maxLength: 128 },
        LastName: { type: 'string', maxLength: 128 },
        FirstName: { type: 'string', maxLength: 128 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        ArtifactsCreated: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true
        },
        ArtifactsOwned: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true
        },
        ProfileImage: {
            type: 'belongsTo',
            entity: 'ProfileImage',
            isCollection: false,
            foreignKey: 'ProfileImage'
        },
        DefaultProject: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'DefaultProject'
        },
        TeamMemberships: {
            type: 'hasMany',
            entity: 'Project',
            isCollection: true
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
        UserPermissions: {
            type: 'hasMany',
            entity: 'UserPermission',
            isCollection: true,
            readOnly: true
        },
        UserProfile: {
            type: 'belongsTo',
            entity: 'UserProfile',
            isCollection: false,
            foreignKey: 'UserProfile',
            readOnly: true
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'Subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        },
    };
}
