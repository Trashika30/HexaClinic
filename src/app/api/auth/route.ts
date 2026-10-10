import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSession, clearSession, getCurrentUser } from "@/lib/auth";
import { addAuditLog } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
    }

    if (!verifyCredentials(username, password)) {
      addAuditLog("Anonymous", "LOGIN", `Failed login attempt for username '${username}'`);
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
    }

    const session = await createSession(username);
    addAuditLog(username, "LOGIN", `Staff member '${username}' authenticated successfully`);

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getCurrentUser();
  return NextResponse.json({ authenticated: !!session, session });
}

export async function DELETE() {
  await clearSession();
  addAuditLog("User", "LOGIN", "Staff member logged out");
  return NextResponse.json({ success: true });
}
