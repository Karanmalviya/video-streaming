const express = require('express');
const router = express.Router();
const {
    uploadVideo,
    getVideos,
    getVideo,
    deleteVideo,
    streamVideo,
    assignVideo,
    unassignVideo,
    getStats,
    reclassifyVideo,
} = require('../controllers/videoController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const upload = require('../config/multer');

router.use(authenticate);

router.get('/stats', getStats);

router.get('/', getVideos);

router.post('/upload', authorize('editor', 'admin'), upload.single('video'), uploadVideo);

router.get('/:id', getVideo);

router.delete('/:id', authorize('editor', 'admin'), deleteVideo);

router.put('/:id/assign', authorize('editor', 'admin'), assignVideo);

router.put('/:id/unassign', authorize('editor', 'admin'), unassignVideo);

router.put('/:id/reclassify', authorize('editor', 'admin'), reclassifyVideo);

router.get('/:id/stream', streamVideo);

module.exports = router;
