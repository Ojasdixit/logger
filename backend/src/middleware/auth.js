// Middleware: validate agent API key for agent-facing endpoints
function agentAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid API key" });
  }
  next();
}

// Middleware: basic auth for admin dashboard endpoints
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res
      .status(401)
      .set("WWW-Authenticate", 'Basic realm="Admin"')
      .json({ error: "Authentication required" });
  }

  const base64 = authHeader.split(" ")[1];
  const [username, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    next();
  } else {
    res.status(403).json({ error: "Invalid credentials" });
  }
}

module.exports = { agentAuth, adminAuth };
