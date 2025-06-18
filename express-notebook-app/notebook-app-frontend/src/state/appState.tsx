import { createContext, useContext, useState } from "react";
import { useAuth } from "react-oidc-context";

export interface Notebook {
    id: string;
    name: string;
    owner: string;
    content: string
    public: boolean;
}

type NotebooksListState =
{ loading: true } |
{ notebooks: Notebook[] } |
{ error: string };

interface NotebooksContextType {
    notebooksListState: NotebooksListState;
    sharedNotebooksListState: NotebooksListState;
    setNotebooksList: (n: Notebook[]) => void;
    setNotebooksListError: (e: string) => void;
    setSharedNotebooksList: (n: Notebook[]) => void;
    setSharedNotebooksListError: (e: string) => void;
}

const NotebooksContext = createContext<NotebooksContextType | undefined>(undefined);

export function NotebooksProvider({ children }: { children: React.ReactNode }) {
    const [notebooksListState, setNotebooksListState] = useState<NotebooksListState>({
        loading: true
    });
    const [sharedNotebooksListState, setSharedNotebooksListState] = useState<NotebooksListState>({
        loading: true
    });

    const value = {
        notebooksListState,
        sharedNotebooksListState,
        setNotebooksList: (notebooks: Notebook[]) => {
            setNotebooksListState({notebooks});
        },
        setNotebooksListError: (error: string) => {
            setNotebooksListState({ error });
        },
        setSharedNotebooksList: (notebooks: Notebook[]) => {
            setSharedNotebooksListState({notebooks});
        },
        setSharedNotebooksListError: (error: string) => {
            setSharedNotebooksListState({ error });
        },
    };

    return (
        <NotebooksContext.Provider value={value}>
            {children}
        </NotebooksContext.Provider>
    );
}

function getBaseApiUrl() {
    return 'http://localhost:3000';
}

export function useNotebooks() {
    const context = useContext(NotebooksContext);
    const auth = useAuth();
    if (context === undefined) {
        throw new Error('useNotebooks must be used within a NotebooksProvider');
    }
    const {
        notebooksListState,
        sharedNotebooksListState,
        setNotebooksList,
        setNotebooksListError,
        setSharedNotebooksList,
        setSharedNotebooksListError,
    } = context;

    const headers = () => {
        return {
            Authorization: `Bearer ${auth.user?.id_token}`,
        };
    };

    const loadNotebooks = async () => {
        const notebooksResult = await fetchJson<Notebook[]>('/notebooks', { headers: headers() });
        if (isApiError(notebooksResult)) {
            setNotebooksListError(notebooksResult.error);
            return;
        }
        setNotebooksList(notebooksResult);
    };

    const loadSharedNotebooks = async () => {
        const sharedNotebooksResult = await fetchJson<Notebook[]>('/shared-with-me', { headers: headers() });
        if (isApiError(sharedNotebooksResult)) {
            setSharedNotebooksListError(sharedNotebooksResult.error);
            return;
        }
        setSharedNotebooksList(sharedNotebooksResult);
    };

    const loadNotebookById = async (notebookId: string) => {
        const notebookResult = await fetchJson<Notebook>(`/notebooks/${notebookId}`, { headers: headers() });
        if (isApiError(notebookResult)) {
            alert("Error: " + notebookResult.error);
            return;
        }
        return notebookResult;
    };

    const shareNotebook = async (notebookId: string, email: string): Promise<string[]> => {
        const result = await fetchJson<{ message: string }>('/share-notebook', {
            method: 'PUT',
            headers: {
                ...headers(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notebookId, email }),
        });
        if (isApiError(result)) {
            alert("Error: " + result.error);
            return [];
        }

        // Get updated ACL after sharing
        const aclResult = await fetchJson<{ acl: string[] }>(`/get-acl/${notebookId}`, {
            headers: headers(),
        });
        if (isApiError(aclResult)) {
            alert("Error loading updated sharing information");
            return [];
        }

        // Due to eventual consistency, ensure the new email is in the results
        const acl = aclResult.acl;
        if (!acl.includes(email)) {
            acl.unshift(email); // Add at the top if not present
        }
        return acl;
    };

    const getNotebookAcl = async (notebookId: string): Promise<string[]> => {
        const result = await fetchJson<{ acl: string[] }>(`/get-acl/${notebookId}`, {
            headers: headers(),
        });
        if (isApiError(result)) {
            alert("Error: " + result.error);
            return [];
        }
        return result.acl;
    };

    const createNotebook = async (name: string, content: string) => {
        const notebookResult = await fetchJson<Notebook>('/notebooks', {
            method: 'POST',
            headers: {
                ...headers(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, content }),
        });
        if (isApiError(notebookResult)) {
            alert("Error: " + notebookResult.error);
            return;
        }
        loadNotebooks();
        return notebookResult;
    
    }

    return {
        notebooksListState,
        sharedNotebooksListState,
        loadNotebooks,
        loadSharedNotebooks,
        loadNotebookById,
        createNotebook,
        shareNotebook,
        getNotebookAcl,
    };
}

interface ApiError {
    error: string;
    status: number;
}

function isApiError(result: any): result is ApiError {
    return 'error' in result && 'status' in result;
}

export async function fetchJson<TResponse>(relativeUrl: string, init: RequestInit): Promise<TResponse|ApiError> {
    const endpoint = getBaseApiUrl() + relativeUrl;
    const httpResponse = await fetch(endpoint, init);
    console.log('init', init);
    if (httpResponse.ok) {
        return httpResponse.json();
    }
    const errorResult: ApiError = {
        error: await httpResponse.text(),
        status: httpResponse.status,
    };
    return errorResult;
}
