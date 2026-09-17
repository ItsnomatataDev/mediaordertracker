import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST: postAuth } = toNextJsHandler(auth);

export { GET };

export async function POST(request: Request) {
  try {
    return await postAuth(request);
  } catch (error) {
    console.error("Auth POST failed", error);
    return Response.json(
      { message: "Could not sign in. Try again." },
      { status: 500 },
    );
  }
}
