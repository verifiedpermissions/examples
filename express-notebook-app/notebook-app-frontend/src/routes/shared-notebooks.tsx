import { useNotebooks } from "../state/appState";
import Spinner from "../components/spinner";
import { useEffect } from "react";
import FullScreenDiv from "../components/fullScreenDiv";
import Card from "../components/card";

export default function SharedNotebooks() {
    const {sharedNotebooksListState, loadSharedNotebooks} = useNotebooks();
    
    useEffect(() => {
        if ('loading' in sharedNotebooksListState) {
            loadSharedNotebooks();
        }
    }, [sharedNotebooksListState]);

    if ('loading' in sharedNotebooksListState) {
        return (
            <Spinner
                type={'dual'}
                size={80}
                fullScreen
                thickness={3}
                color={'#2ecc71'}
            />
        );
    }
    if ('error' in sharedNotebooksListState) {
        return <FullScreenDiv content={sharedNotebooksListState.error} />;
    }
    
    if (sharedNotebooksListState.notebooks.length === 0) {
        return <div>No shared notebooks found.</div>
    }
    
    return (
        <>
            {
                sharedNotebooksListState
                    .notebooks
                    .map(notebook => {
                        return (
                            <Card
                                key={notebook.id}
                                name={notebook.name}
                                content={notebook.content}
                                href={`/notebooks/${notebook.id}`}
                            />
                        )
                    })
            }
        </>
    )
}
