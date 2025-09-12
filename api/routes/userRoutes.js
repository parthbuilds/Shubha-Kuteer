let users = [
    {
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        permissions: {
            addProduct: true,
            updateProduct: true,
            deleteProduct: true,
            applyDiscount: true,
            createCoupon: true
        }
    }
];

export default function handler(req, res) {
    if (req.method === "POST") {
        const { name, email, password, role, permissions } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const exists = users.find(u => u.email === email);
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = { name, email, password, role, permissions };
        users.push(newUser);

        res.json({ message: "User added successfully ✅", user: newUser });
    } else if (req.method === "GET") {
        res.json(users);
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}