import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react';
import {generateClient} from "aws-amplify/data";
import ProfileSetup from "./ProfileSetup";
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function AppHome() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
    const [profile, setProfile] = useState<Schema["UserProfile"]["type"] | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const { user, signOut } = useAuthenticator();

    // Resolve derived role from Cognito groups (computed asynchronously in effect)

    useEffect(() => {
        // Load todos
        const sub = client.models.Todo.observeQuery().subscribe({
            next: (data) => setTodos([...data.items]),
        });
        return () => sub.unsubscribe();
    }, []);

    useEffect(() => {
        // On login, determine groups and attempt to load UserProfile by user id
        (async () => {
            try {
                setLoadingProfile(true);
                const current = await getCurrentUser();
                const session = await fetchAuthSession();
                const groups = ((session.tokens?.accessToken?.payload as any)?.["cognito:groups"] || []) as string[];
                const groupSet = new Set(groups.map(g => g.toLowerCase()));
                const role: Schema["UserProfile"]["type"]["role"] = groupSet.has('admin')
                    ? 'ADMIN'
                    : groupSet.has('creator')
                        ? 'CREATOR'
                        : groupSet.has('customer')
                            ? 'CUSTOMER'
                            : 'CUSTOMER'; // default role for authenticated users
                // Try to get existing profile by id
                const result = await client.models.UserProfile.get({ id: current.userId });
                if (result?.data) {
                    setProfile(result.data);
                } else if ((result as any)?.id) {
                    // In case client returns entity directly
                    setProfile(result as any);
                } else {
                    setProfile(null);
                }
                // Store computed role for later use if needed
                (window as any).__derivedRole = role;
            } catch (e) {
                console.error('Failed to load profile', e);
                setProfile(null);
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, [user?.userId]);

    function deleteTodo(id: string) {
        client.models.Todo.delete({id})
    }

    function createTodo() {
        client.models.Todo.create({content: window.prompt("Todo content") || ""});
    }

    if (loadingProfile) {
        return <main><p>Loading profile…</p></main>;
    }

    // If profile does not exist, render profile setup
    if (!profile) {
        const defaultRole = ((window as any).__derivedRole as Schema["UserProfile"]["type"]["role"]) || 'CUSTOMER';
        const userId = (user as any)?.userId || (user as any)?.username || '';
        return <ProfileSetup userId={userId} defaultRole={defaultRole} onSaved={(p) => setProfile(p)} />
    }

    const roleLabel = profile.role;

    return (
        <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>{user?.signInDetails?.loginId}'s todos</h1>
                <div>
                    <span style={{ padding: '2px 8px', border: '1px solid #ccc', borderRadius: 12, marginRight: 12 }}>Role: {roleLabel}</span>
                    <button onClick={signOut}>Sign out</button>
                </div>
            </div>
            <button onClick={createTodo}>+ new</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}  onClick={() => deleteTodo(todo.id)}>{todo.content}</li>
                ))}
            </ul>
            <div>
                🥳 App successfully hosted. Try creating a new todo.
                <br/>
                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                    Review next step of this tutorial.
                </a>
            </div>
        </main>
    );
}

import PickleCheezePage from './websites/pickleCheeze/PickleCheezePage';

function AppRouter() {
    const path = (typeof window !== 'undefined' ? window.location.pathname : '/') || '/';
    if (path.startsWith('/pickle-cheeze')) {
        return <PickleCheezePage/>;
    }
    return <AppHome/>;
}

export default AppRouter;
