export default async function handler(req, res) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;

  if (!user || !pass) {
    res.statusCode = 500;
    res.end("Missing DASHBOARD_USER or DASHBOARD_PASSWORD");
    return;
  }

  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Sprint Review Dashboard"');
    res.statusCode = 401;
    res.end("Authentication required");
    return;
  }

  const encoded = auth.replace("Basic ", "");
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const [inputUser, inputPass] = decoded.split(":");

  if (inputUser !== user || inputPass !== pass) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Sprint Review Dashboard"');
    res.statusCode = 401;
    res.end("Unauthorized");
    return;
  }

  const path = req.query.path || "index.html";

  res.setHeader("Location", "/" + path);
  res.statusCode = 302;
  res.end();
}
