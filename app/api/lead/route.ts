import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

type LeadBody = {
	name?: unknown;
	email?: unknown;
	company?: unknown;
	message?: unknown;
};

export async function POST(req: NextRequest) {
	try {
		const contentType = req.headers.get("content-type") || "";
		let body: LeadBody = {};
		if (contentType.includes("application/json")) {
			body = (await req.json()) as LeadBody;
		} else {
			const form = await req.formData();
			body = Object.fromEntries(form.entries()) as LeadBody;
		}

		const name = String(body.name ?? "").trim();
		const email = String(body.email ?? "").trim();
		const companyVal = body.company != null ? String(body.company).trim() : null;
		const messageVal = body.message != null ? String(body.message).trim() : null;

		if (!name || !email) {
			return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
		}

		await prisma.lead.create({
			data: { name, email, company: companyVal || undefined, message: messageVal || undefined },
		});

		return NextResponse.redirect(new URL("/thank-you", req.url), { status: 303 });
	} catch (error) {
		console.error("Lead submission failed", error);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}
