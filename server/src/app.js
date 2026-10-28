const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const complaintRoutes = require('./routes/complaint.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling (Must be mounted AFTER all routes)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
