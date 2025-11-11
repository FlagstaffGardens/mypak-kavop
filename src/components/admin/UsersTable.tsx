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
}

export function UsersTable({ users }: UsersTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

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
            const isVisible = visiblePasswords.has(user.user_id);
            return (
              <TableRow key={user.user_id}>
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
                      onClick={() => togglePassword(user.user_id)}
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
                        onClick={() => copyPassword(user.password, user.user_id)}
                      >
                        {copiedUserId === user.user_id ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : <span className="text-gray-400">Never</span>
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Delete
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
