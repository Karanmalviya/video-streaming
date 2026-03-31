const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const User = require('../models/User');
const { processVideo } = require('../services/processingService');

const uploadVideo = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file provided.' });
        }

        const title = req.body.title || req.file.originalname;
        const description = req.body.description || '';

        const video = await Video.create({
            title,
            description,
            originalName: req.file.originalname,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            size: req.file.size,
            status: 'processing',
            progress: 0,
            classification: 'pending',
            uploadedBy: req.user._id,
            organizationId: req.user.organizationId,
        });


        processVideo(video._id, req.user._id).catch((err) =>
            console.error('Background processing error:', err)
        );

        res.status(201).json({
            message: 'Video uploaded successfully. Processing started.',
            video,
        });
    } catch (error) {
        next(error);
    }
};

const getVideos = async (req, res, next) => {
    try {
        const { status, classification, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        let query = {};

        if (req.user.role === 'admin') {

            query.organizationId = req.user.organizationId;
        } else if (req.user.role === 'viewer') {

            query.assignedTo = req.user._id;
        } else {

            query.uploadedBy = req.user._id;
        }

        if (status && ['uploading', 'processing', 'completed', 'failed'].includes(status)) {
            query.status = status;
        }


        if (classification && ['safe', 'flagged', 'pending'].includes(classification)) {
            query.classification = classification;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { originalName: { $regex: search, $options: 'i' } },
            ];
        }


        const allowedSortFields = ['createdAt', 'size', 'title'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDir = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const total = await Video.countDocuments(query);
        const videos = await Video.find(query)
            .sort({ [sortField]: sortDir })
            .skip(skip)
            .limit(parseInt(limit, 10))
            .populate('uploadedBy', 'name email');

        res.json({
            videos,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                pages: Math.ceil(total / parseInt(limit, 10)),
            },
        });
    } catch (error) {
        next(error);
    }
};

const getVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('assignedTo', 'name email role');
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }


        const isOwner = video.uploadedBy._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        const isAssigned = video.assignedTo?.some((u) => {
            const uId = typeof u === 'object' && u._id ? u._id : u;
            return uId.toString() === req.user._id.toString();
        });
        if (!isOwner && !isAdmin && !isAssigned) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.json({ video });
    } catch (error) {
        next(error);
    }
};

const deleteVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }


        if (
            req.user.role !== 'admin' &&
            video.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: 'Access denied.' });
        }


        if (fs.existsSync(video.filePath)) {
            fs.unlinkSync(video.filePath);
        }

        await Video.findByIdAndDelete(req.params.id);
        res.json({ message: 'Video deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

const streamVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }


        const isOwner = video.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        const isAssigned = video.assignedTo?.some((id) => id.toString() === req.user._id.toString());
        if (!isOwner && !isAdmin && !isAssigned) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const filePath = path.resolve(video.filePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Video file not found on disk.' });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {

            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const stream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': video.mimeType,
            });

            stream.pipe(res);
        } else {

            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': video.mimeType,
            });
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        next(error);
    }
};

const assignVideo = async (req, res, next) => {
    try {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds array is required.' });
        }

        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }


        if (
            req.user.role !== 'admin' &&
            video.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: 'Access denied.' });
        }


        const users = await User.find({
            _id: { $in: userIds },
        });

        if (users.length !== userIds.length) {
            const foundIds = users.map((u) => u._id.toString());
            const notFound = userIds.filter((id) => !foundIds.includes(id));
            return res.status(400).json({
                message: `User IDs not found: ${notFound.join(', ')}`,
            });
        }


        const existingIds = video.assignedTo.map((id) => id.toString());
        const newIds = userIds.filter((id) => !existingIds.includes(id));
        video.assignedTo.push(...newIds);
        await video.save();

        const updated = await Video.findById(video._id)
            .populate('assignedTo', 'name email role')
            .populate('uploadedBy', 'name email');

        res.json({ message: 'Video assigned successfully.', video: updated });
    } catch (error) {
        next(error);
    }
};

const unassignVideo = async (req, res, next) => {
    try {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds array is required.' });
        }

        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }

        if (
            req.user.role !== 'admin' &&
            video.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        video.assignedTo = video.assignedTo.filter(
            (id) => !userIds.includes(id.toString())
        );
        await video.save();

        const updated = await Video.findById(video._id)
            .populate('assignedTo', 'name email role')
            .populate('uploadedBy', 'name email');

        res.json({ message: 'Users unassigned successfully.', video: updated });
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        let matchQuery = {};
        if (req.user.role === 'admin') {
            matchQuery.organizationId = req.user.organizationId;
        } else if (req.user.role === 'viewer') {
            matchQuery.assignedTo = req.user._id;
        } else {
            matchQuery.uploadedBy = req.user._id;
        }

        const stats = await Video.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    safe: { $sum: { $cond: [{ $eq: ['$classification', 'safe'] }, 1, 0] } },
                    flagged: { $sum: { $cond: [{ $eq: ['$classification', 'flagged'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$classification', 'pending'] }, 1, 0] } },
                },
            },
        ]);

        res.json({ stats: stats[0] || { total: 0, processing: 0, completed: 0, failed: 0, safe: 0, flagged: 0, pending: 0 } });
    } catch (error) {
        next(error);
    }
};

const reclassifyVideo = async (req, res, next) => {
    try {
        const { classification } = req.body;
        if (!['safe', 'flagged'].includes(classification)) {
            return res.status(400).json({ message: 'Classification must be safe or flagged.' });
        }

        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        if (req.user.role !== 'admin' && video.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        video.classification = classification;
        await video.save();

        res.json({ message: 'Classification updated.', video });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadVideo, getVideos, getVideo, deleteVideo, streamVideo, assignVideo, unassignVideo, getStats, reclassifyVideo };
