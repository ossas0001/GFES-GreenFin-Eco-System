import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { GreenPlatformApp, type LoginRole } from "../GreenPlatformDemo";

type BackendRole = Exclude<LoginRole, "consumer">;

const portalLabels: Record<BackendRole, string> = {
  farmer: "合作小農後台｜綠色消費平台",
  institution: "銀行／政府／企業後台｜綠色消費平台",
  admin: "平台管理員後台｜綠色消費平台",
};

function isBackendRole(value: string): value is BackendRole {
  return value === "farmer" || value === "institution" || value === "admin";
}

export async function generateMetadata({ params }: { params: Promise<{ portal: string }> }): Promise<Metadata> {
  const { portal } = await params;
  return isBackendRole(portal) ? { title: portalLabels[portal] } : {};
}

export default async function PortalPage({ params }: { params: Promise<{ portal: string }> }) {
  const { portal } = await params;
  if (!isBackendRole(portal)) notFound();
  const cookieStore = await cookies();
  const initialSessionExpected = cookieStore.has(`gfes_session_${portal}`) || cookieStore.has("gfes_session");
  return <GreenPlatformApp initialPortal={portal} initialSessionExpected={initialSessionExpected} />;
}
