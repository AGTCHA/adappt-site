import { NextResponse } from "next/server";
import { AuthError } from "./auth";

/** Wraps API handlers with uniform auth/error handling. */
export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error("API error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
