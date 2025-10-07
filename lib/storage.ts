import { apiPost } from "./api";
import { supabase } from "./supabase";

export type SignedUploadUrlResponse = {
  url: string;
  path: string;
  token?: string;
};

export async function createSignedUploadUrl(
  filename: string,
  options?: { upsert?: boolean }
): Promise<SignedUploadUrlResponse> {
  return apiPost<SignedUploadUrlResponse>("/storage/upload-url", {
    filename,
    ...(options?.upsert !== undefined ? { upsert: options.upsert } : {}),
  });
}

export async function createSignedDownloadUrl(
  path: string,
  expiresIn?: number
): Promise<{ url: string }> {
  return apiPost<{ url: string }>("/storage/download-url", {
    path,
    ...(expiresIn !== undefined ? { expiresIn } : {}),
  });
}

export type UploadFromUriParams = {
  uri: string;
  fileName: string;
  contentType?: string;
  upsert?: boolean;
};

export async function uploadFileFromUri({
  uri,
  fileName,
  contentType,
  upsert,
}: UploadFromUriParams): Promise<{ path: string }> {
  console.log("📤 Starting uploadFileFromUri...");
  console.log("📝 Parameters:", {
    fileName,
    contentType,
    upsert,
    uriLength: uri.length,
  });

  console.log("🔗 Creating signed upload URL...");
  const { url, token, path } = await createSignedUploadUrl(fileName, {
    upsert,
  });
  console.log("✅ Signed URL created:", {
    path,
    hasUrl: !!url,
    hasToken: !!token,
    urlLength: url?.length,
  });

  console.log("📋 Preparing FormData...");
  const formData = new FormData();
  if (token) {
    console.log("🔑 Adding token to FormData");
    formData.append("token", token);
  } else {
    console.log("⚠️ No token received from backend");
  }

  const fileObject = {
    uri,
    name: fileName,
    type: contentType ?? "application/octet-stream",
  };
  console.log("📎 File object:", fileObject);
  formData.append("file", fileObject as any);

  // Get the user's access token for authorization header
  console.log("� Getting user access token...");
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("No access token found - user may not be authenticated");
  }
  console.log("✅ Access token obtained");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  console.log("�🚀 Making upload request to:", url.substring(0, 100) + "...");
  console.log("🔑 Including Authorization header");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  console.log("📨 Upload response:", {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    console.error("❌ Upload failed - Error text:", errorText);
    console.error("❌ Response details:", {
      status: response.status,
      statusText: response.statusText,
      url: url.substring(0, 100) + "...",
    });

    throw new Error(
      errorText
        ? `Upload failed: ${errorText}`
        : `Upload failed (${response.status})`
    );
  }

  console.log("🎉 Upload successful! Path:", path);
  return { path };
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
