import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for User
 */
export class User extends RallyEntity {
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
        DateTimeFormat: { type: 'string', maxLength: 128, enum: ['yyyy-MM-dd hh:mm a z', 'MM/dd/yyyy hh:mm a z', 'dd/MM/yyyy hh:mm a z', 'yyyy/MM/dd hh:mm a z', 'yyyy-MMM-dd hh:mm a z', 'yyyy-MM-dd HH:mm z', 'MM/dd/yyyy HH:mm z', 'dd/MM/yyyy HH:mm z', 'yyyy/MM/dd HH:mm z', 'yyyy-MMM-dd HH:mm z', 'yyyy-MM-dd z', 'MM/dd/yyyy z', 'dd/MM/yyyy z', 'yyyy/MM/dd z', 'yyyy-MMM-dd z', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'], filterable: false, sortable: false },
        DateFormat: { type: 'string', maxLength: 128, enum: ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'], filterable: false, sortable: false },
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
        Role: { type: 'string', maxLength: 128, enum: ['Product Owner', 'Scrum Master', 'Architect', 'Developer', 'Tester', 'Technical Writer', 'User Experience'] },
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
