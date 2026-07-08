import { createContext, useContext, useState, type ReactNode } from "react";
import api from "../services/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    const saveSession = (data: any) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
        }));
        setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
    };

    const login = async (email: string, password: string) => {
        const res = await api.post("/Auth/login", { email, password });
        saveSession(res.data);
    };

    const register = async (name: string, email: string, password: string, role: string) => {
        const res = await api.post("/Auth/register", { name, email, password, role });
        saveSession(res.data);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}