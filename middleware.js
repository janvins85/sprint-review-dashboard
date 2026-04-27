export function middleware(req) {
  const auth = req.headers.get("authorization");

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;

  if (!user || !pass) {
    return new Response("Missing auth configuration", { status: 500 });
  }

  if (!auth || !auth.startsWith("Basic ")) {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Sprint Review Dashboard"',
      },
    });
  }

  const encoded = auth.replace("Basic ", "");
  const decoded = atob(encoded);
  const [inputUser, inputPass] = decoded.split(":");

  if (inputUser === user && inputPass === pass) {
    return;
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sprint Review Dashboard"',
    },
  });
}

export const config = {
  matcher: "/:path*",
};
