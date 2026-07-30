import { AuthError, ModuleError } from "./auth";
import { NextResponse } from "next/server";

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  }
  if (error instanceof ModuleError) {
    return NextResponse.json(
      { error: `The ${error.module} module is not enabled on your account.` },
      { status: 403 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
