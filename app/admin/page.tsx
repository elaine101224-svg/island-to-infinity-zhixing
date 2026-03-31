"use client";

import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    const loggedIn = localStorage.getItem("admin_logged_in");
    if (!loggedIn) {
      window.location.href = "/admin/login";
    }
  }, []);

  return <h1>Admin Home</h1>;
}