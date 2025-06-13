// Defines permitted customer user group actions
permit (
    principal in PetStoreApp::UserGroup::"<userPoolId>|customer",
    action in
        [PetStoreApp::Action::"GET /pets",
         PetStoreApp::Action::"POST /pets",
         PetStoreApp::Action::"GET /pets/{petId}"],
    resource
);