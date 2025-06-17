const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const { VerifiedPermissionsClient, ListPoliciesCommand, CreatePolicyCommand } = require("@aws-sdk/client-verifiedpermissions");
const { CognitoIdentityProviderClient, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { notebooksRepository } = require('./notebookRepository');
const verifyToken = require('./middleware/authMiddleware');
const oaig = require('express-openapi-generator');
const { ExpressAuthorizationMiddleware } = require('@cedar-policy/authorization-for-expressjs');
const { AVPAuthorizationEngine } = require('@verifiedpermissions/authorization-clients-js');

const documentBuilder = oaig.DocumentBuilder.initializeDocument({
    openapi: '3.0.1',
    info: {
        title: 'A example document',
        version: '1',
    },
    paths: {}, // You don't need to include any path objects, those will be generated later
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const allowedOrigin = 'http://localhost:5173'; // set this differently depending on env
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const avpAuthorizationEngine = new AVPAuthorizationEngine({
    policyStoreId: process.env.POLICY_STORE_ID,
    callType: 'identityToken'
});

const expressAuthorization = new ExpressAuthorizationMiddleware({
    schema: {
        type: 'jsonString',
        schema: fs.readFileSync(path.join(__dirname, 'v4.cedarschema.json'), 'utf8'),
    },
    authorizationEngine: avpAuthorizationEngine,
    principalConfiguration: { type: 'identityToken' },
    skippedEndpoints: [
        { httpVerb: 'get', path: '/login' },
        { httpVerb: 'get', path: '/api-spec/v3' },
        { httpVerb: 'get', path: '/notebooks/:id' },
        { httpVerb: 'put', path: '/notebooks/:id' },
        { httpVerb: 'delete', path: '/notebooks/:id' },
        { httpVerb: 'put', path: '/notebook/share' },
    ],
    logger: {
        debug: s => console.log(s),
        log: s => console.log(s),
    }
});

// Apply the JWT verification middleware to protected routes
app.use(verifyToken);

app.use(expressAuthorization.middleware);

app.get('/notebooks', async (req, res) => {
    const principalSub = req.user.sub; // Use the sub from the verified JWT
    const notebooks = await notebooksRepository.findByOwner(principalSub);
    res.json(notebooks);
});

app.post('/notebooks', (req, res) => {
    const principalSub = req.user.sub; // Use the sub from the verified JWT
    const id = Date.now().toString();
    console.log('received body', req.body);
    const notebook = {
        id,
        name: req.body.name,
        owner: principalSub,
        content: req.body.content
    };
    notebooksRepository.saveNotebook(notebook);
    console.log(notebooksRepository.findById(id));
    res.status(201).json(notebook);
});

const notebookSchema = {
    title: 'A notebook object',
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        owner: { type: 'string' },
        content: { type: 'string' },
        public: { type: 'boolean' },
    },
    required: ['id', 'name', 'owner', 'content'],
};
const NOTEBOOK = 'Notebook';
documentBuilder.schema(NOTEBOOK, { component: notebookSchema });

const getNotebookByIdOperation = {
    operationId: 'getNotebookById',
    'x-cedar': {
        appliesToResourceTypes: [NOTEBOOK]
    },
    responses: {
        '200': {
            description: 'Get notebook by id',
            content: {
                'application/json': {
                    schema: documentBuilder.schema(NOTEBOOK),
                },
            },
        },
    },
};
app.get('/notebooks/:id',
    oaig.PathMiddleware.path('getNotebookById', { operationObject: getNotebookByIdOperation }),
    expressAuthorization.handlerSpecificMiddleware({
        resourceProvider: async req => {
            const notebook = await notebooksRepository.findById(req.params.id);
            return {
                uid: {
                    type: 'NotebooksApp::Notebook',
                    id: req.params.id
                },
                attrs: notebook,
                parents: [],
            }
        }
    }),
    async function getNotebookById(req, res) {
        console.log(req.params);
        const notebook = await notebooksRepository.findById(req.params.id);
        if (notebook) {
            res.json(notebook);
        } else {
            res.status(404).send('Notebook not found');
        }
    });

const putNotebookOperation = {
    operationId: 'putNotebook',
    'x-cedar': {
        appliesToResourceTypes: [NOTEBOOK]
    },
    responses: {
        '200': {
            description: 'Put notebook',
            content: {
                'application/json': {
                    schema: documentBuilder.schema(NOTEBOOK),
                },
            },
        },
    },
};
app.put(
    '/notebooks/:id',
    oaig.PathMiddleware.path('putNotebook', { operationObject: putNotebookOperation }),
    expressAuthorization.handlerSpecificMiddleware({
        resourceProvider: async req => {
            const notebook = await notebooksRepository.findById(req.params.id);
            return {
                uid: {
                    type: 'NotebooksApp::Notebook',
                    id: req.params.id
                },
                attrs: notebook,
                parents: [],
            }
        }
    }),
    async (req, res) => {
        const notebook = await notebooksRepository.putNotebook(req.params.id, req.body);
        if (notebook) {
            res.json(notebook);
        } else {
            res.status(404).send('Notebook not found');
        }
    });

const deleteNotebookOperation = {
    operationId: 'deleteNotebook',
    'x-cedar': {
        appliesToResourceTypes: [NOTEBOOK]
    }
};

app.delete(
    '/notebooks/:id',
    oaig.PathMiddleware.path('deleteNotebook', { operationObject: deleteNotebookOperation }),
    expressAuthorization.handlerSpecificMiddleware({
        resourceProvider: async req => {
            const notebook = await notebooksRepository.findById(req.params.id);
            return {
                uid: {
                    type: 'NotebooksApp::Notebook',
                    id: req.params.id
                },
                attrs: notebook,
                parents: [],
            }
        }
    }),
    async (req, res) => {
        await notebooksRepository.deleteNotebook(req.params.id);
        res.status(200).send('Ok');
    });

// Configure AWS SDK v3
const verifiedPermissionsClient = new VerifiedPermissionsClient();
const cognitoClient = new CognitoIdentityProviderClient();

const shareNotebookOperation = {
    operationId: 'shareNotebook',
    'x-cedar': {
        appliesToResourceTypes: [NOTEBOOK]
    },
    responses: {
        '200': {
            description: 'Get notebook by id',
            content: {
                'application/json': {
                    schema: documentBuilder.schema(NOTEBOOK),
                },
            },
        },
    },
};
app.put(
    '/notebook/share',
    oaig.PathMiddleware.path('shareNotebook', { operationObject: shareNotebookOperation }),
    expressAuthorization.handlerSpecificMiddleware({
        resourceProvider: async req => {
            const notebook = await notebooksRepository.findById(req.params.id);
            return {
                uid: {
                    type: 'NotebooksApp::Notebook',
                    id: req.params.id
                },
                attrs: notebook,
                parents: [],
            }
        }
    }),
    async (req, res) => {
    try {
        const { notebookId, email } = req.body;

        if (!notebookId || !email) {
            return res.status(400).json({ error: 'Missing required fields: notebookId and email' });
        }

        // Step 1: Look up user by email in Cognito
        const listUsersParams = {
            UserPoolId: process.env.USER_POOL_ID,
            Filter: `email = "${email}"`,
            Limit: 1
        };
        
        const listUsersCommand = new ListUsersCommand(listUsersParams);
        const usersResponse = await cognitoClient.send(listUsersCommand);
        
        if (!usersResponse.Users || usersResponse.Users.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const userSub = usersResponse.Users[0].Attributes.find(attr => attr.Name === 'sub').Value;

        // Step 2: Check if policy already exists
        const listPoliciesParams = {
            policyStoreId: process.env.POLICY_STORE_ID,
            filter: {
                principal: {
                    identifier: {
                        entityType: 'NotebooksApp::User',
                        entityId: userSub
                    }
                },
                resource: {
                    identifier: {
                        entityType: 'NotebooksApp::Notebook',
                        entityId: notebookId
                    }
                }
            }
        };

        const listPoliciesCommand = new ListPoliciesCommand(listPoliciesParams);
        const policiesResponse = await verifiedPermissionsClient.send(listPoliciesCommand);

        // Step 3: If policy exists, return 200
        if (policiesResponse.policies && policiesResponse.policies.length > 0) {
            return res.status(200).json({ message: 'Notebook already shared with user' });
        }

        // Step 4: Create new policy
        const policyStatement = `permit(principal == NotebooksApp::User::\"${userSub}\", action == NotebooksApp::Action::\"getNotebookById\", resource == NotebooksApp::Notebook::\"${notebookId}\");`;
        
        const createPolicyParams = {
            policyStoreId: process.env.POLICY_STORE_ID,
            statement: policyStatement
        };

        const createPolicyCommand = new CreatePolicyCommand(createPolicyParams);
        await verifiedPermissionsClient.send(createPolicyCommand);

        res.status(200).json({ message: 'Notebook shared successfully' });
    } catch (error) {
        console.error('Error sharing notebook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/notebooks/shared-with-me', async (req, res) => {
    try {
        const userId = req.user.sub; // Use the sub from the verified JWT

        const params = {
            policyStoreId: process.env.POLICY_STORE_ID,
            maxResults: 20,
            filter: {
                principal: {
                    identifier: {
                        entityType: 'NotebooksApp::User',
                        entityId: userId
                    }
                }
            }
        };

        const command = new ListPoliciesCommand(params);
        const response = await verifiedPermissionsClient.send(command);
        const resourceIds = response.policies.map(policy => policy.resource);

        res.json(resourceIds);
    } catch (error) {
        console.error('Error fetching shared notebooks:', error);
        res.status(500).send('Internal server error');
    }
});


documentBuilder.generatePathsObject(app);

console.log(JSON.stringify(documentBuilder.build(), null, 4));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
