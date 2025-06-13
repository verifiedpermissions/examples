// Defines permitted administrator user group actions
permit (
    principal in PetStoreApp::UserGroup::"<userPoolId>|administrator",
    action,
    resource
);
