export default function handler(req, res) {
    if (req.method === "POST" && req.url.endsWith("/login")) {
        res.json({ message: "Login route working ✅" });
    } else if (req.method === "POST" && req.url.endsWith("/register")) {
        res.json({ message: "Register route working ✅" });
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}