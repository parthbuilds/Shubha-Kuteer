// Simple function without any dependencies
export default function handler(req, res) {
    res.status(200).json({
        message: 'Simple function working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
}
