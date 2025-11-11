"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, EyeOff, Copy } from "lucide-react";
import { User } from "@/lib/types";

interface UsersTableProps {
  users: User[];
  orgId: string;
  onUserDeleted?: () => void;
}

export function UsersTable({ users, orgId, onUserDeleted }: UsersTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  function togglePassword(userId: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setVisiblePasswords((current) => {
            const updated = new Set(current);
            updated.delete(userId);
            return updated;
          });
        }, 10000);
      }
      return next;
    });
  }

  async function copyPassword(password: string, userId: string) {
    await navigator.clipboard.writeText(password);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Refresh the page or call callback
      if (onUserDeleted) {
        onUserDeleted();
      } else {
        window.location.reload();
      }
    } catch (error) {
      alert("Failed to delete user. Please try again.");
      console.error(error);
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isVisible = visiblePasswords.has(user.id);
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {isVisible ? user.password : "•••••••"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePassword(user.id)}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {isVisible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPassword(user.password, user.id)}
                      >
                        {copiedUserId === user.id ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : <span className="text-gray-400">Never</span>
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    disabled={deletingUserId === user.id}
                  >
                    {deletingUserId === user.id ? "Deleting..." : "Delete"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
