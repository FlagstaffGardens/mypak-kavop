import { useEffect, useState } from "react";

interface User {
  userId: string;
  email: string;
  name: string;
  role: "platform_admin" | "org_user";
  orgId: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user on mount
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      setUser(null);
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return { user, loading, signOut };
}
