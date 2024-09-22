const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');

// Helmet for securing HTTP headers
function secureHeaders(app) {
    app.use(helmet());
}

// CORS setup
function enableCors(app) {
    app.use(cors());
}

// Middleware for authorization using JWT tokens
function authorize(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
}

module.exports = { secureHeaders, enableCors, authorize };
