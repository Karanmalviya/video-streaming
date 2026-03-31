const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err.message);


    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            message: 'File too large. Maximum allowed size is 100 MB.',
        });
    }


    if (err.name === 'MulterError') {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }


    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({ message: 'Validation failed', errors });
    }


    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            message: `Duplicate value for field: ${field}`,
        });
    }


    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }


    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal server error',
    });
};

module.exports = errorHandler;
