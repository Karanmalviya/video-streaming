const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../server');
const { connectTestDB, cleanDB, disconnectDB, createTestUser } = require('./setup');
const Video = require('../models/Video');

const TEST_VIDEO_PATH = path.join(__dirname, 'test-video.mp4');

beforeAll(async () => {
    await connectTestDB();

    fs.writeFileSync(TEST_VIDEO_PATH, Buffer.alloc(1024, 0));
});

afterEach(async () => {
    await cleanDB();
});

afterAll(async () => {
    await disconnectDB();

    if (fs.existsSync(TEST_VIDEO_PATH)) fs.unlinkSync(TEST_VIDEO_PATH);

    const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach((f) => {
            try { fs.unlinkSync(path.join(uploadsDir, f)); } catch (_) { }
        });
    }
});

describe('POST /api/videos/upload', () => {
    it('should upload a video file successfully', async () => {
        const { token } = await createTestUser({ role: 'editor' });

        const res = await request(app)
            .post('/api/videos/upload')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Test Video')
            .attach('video', TEST_VIDEO_PATH, { contentType: 'video/mp4', filename: 'test.mp4' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('video');
        expect(res.body.video.title).toBe('Test Video');
        expect(res.body.video.status).toBe('processing');
        expect(res.body.video.classification).toBe('pending');
    });

    it('should reject upload without auth', async () => {
        const res = await request(app)
            .post('/api/videos/upload')
            .attach('video', TEST_VIDEO_PATH, { contentType: 'video/mp4', filename: 'test.mp4' });

        expect(res.statusCode).toBe(401);
    });

    it('should reject upload from viewer role', async () => {
        const { token } = await createTestUser({ role: 'viewer' });

        const res = await request(app)
            .post('/api/videos/upload')
            .set('Authorization', `Bearer ${token}`)
            .attach('video', TEST_VIDEO_PATH, { contentType: 'video/mp4', filename: 'test.mp4' });

        expect(res.statusCode).toBe(403);
    });
});

describe('GET /api/videos', () => {
    it('should list videos for authenticated user', async () => {
        const { user, token } = await createTestUser({ role: 'editor' });


        await Video.create({
            title: 'My Video',
            originalName: 'my-video.mp4',
            filePath: '/fake/path.mp4',
            mimeType: 'video/mp4',
            size: 5000,
            status: 'completed',
            classification: 'safe',
            uploadedBy: user._id,
            organizationId: user.organizationId,
        });

        const res = await request(app)
            .get('/api/videos')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].title).toBe('My Video');
        expect(res.body).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
        const { user, token } = await createTestUser();

        await Video.create([
            { title: 'V1', originalName: 'v1.mp4', filePath: '/a', mimeType: 'video/mp4', size: 100, status: 'completed', classification: 'safe', uploadedBy: user._id, organizationId: user.organizationId },
            { title: 'V2', originalName: 'v2.mp4', filePath: '/b', mimeType: 'video/mp4', size: 200, status: 'processing', classification: 'pending', uploadedBy: user._id, organizationId: user.organizationId },
        ]);

        const res = await request(app)
            .get('/api/videos?status=completed')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].status).toBe('completed');
    });

    it('should filter by classification', async () => {
        const { user, token } = await createTestUser();

        await Video.create([
            { title: 'Safe', originalName: 's.mp4', filePath: '/s', mimeType: 'video/mp4', size: 100, status: 'completed', classification: 'safe', uploadedBy: user._id, organizationId: user.organizationId },
            { title: 'Flagged', originalName: 'f.mp4', filePath: '/f', mimeType: 'video/mp4', size: 200, status: 'completed', classification: 'flagged', uploadedBy: user._id, organizationId: user.organizationId },
        ]);

        const res = await request(app)
            .get('/api/videos?classification=flagged')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].classification).toBe('flagged');
    });

    it('should search by title', async () => {
        const { user, token } = await createTestUser();

        await Video.create([
            { title: 'Holiday Trip', originalName: 'h.mp4', filePath: '/h', mimeType: 'video/mp4', size: 100, status: 'completed', classification: 'safe', uploadedBy: user._id, organizationId: user.organizationId },
            { title: 'Work Meeting', originalName: 'w.mp4', filePath: '/w', mimeType: 'video/mp4', size: 200, status: 'completed', classification: 'safe', uploadedBy: user._id, organizationId: user.organizationId },
        ]);

        const res = await request(app)
            .get('/api/videos?search=holiday')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].title).toBe('Holiday Trip');
    });

    it('should isolate videos between users', async () => {
        const { user: user1, token: token1 } = await createTestUser({ email: 'user1@test.com' });
        const { user: user2, token: token2 } = await createTestUser({ email: 'user2@test.com' });

        await Video.create({
            title: 'User1 Video',
            originalName: 'u1.mp4',
            filePath: '/u1',
            mimeType: 'video/mp4',
            size: 100,
            status: 'completed',
            classification: 'safe',
            uploadedBy: user1._id,
            organizationId: user1.organizationId,
        });


        const res = await request(app)
            .get('/api/videos')
            .set('Authorization', `Bearer ${token2}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(0);
    });
});

describe('GET /api/videos/:id/stream', () => {
    it('should stream a video with range request (206)', async () => {
        const { user, token } = await createTestUser();


        const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const testFilePath = path.join(uploadsDir, 'stream-test.mp4');
        fs.writeFileSync(testFilePath, Buffer.alloc(2048, 0));

        const video = await Video.create({
            title: 'Stream Test',
            originalName: 'stream.mp4',
            filePath: testFilePath,
            mimeType: 'video/mp4',
            size: 2048,
            status: 'completed',
            classification: 'safe',
            uploadedBy: user._id,
            organizationId: user.organizationId,
        });

        const res = await request(app)
            .get(`/api/videos/${video._id}/stream?token=${token}`)
            .set('Range', 'bytes=0-1023');

        expect(res.statusCode).toBe(206);
        expect(res.headers['content-range']).toMatch(/bytes 0-1023\/2048/);
        expect(res.headers['content-type']).toBe('video/mp4');


        fs.unlinkSync(testFilePath);
    });

    it('should return 200 when no range header', async () => {
        const { user, token } = await createTestUser();

        const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
        const testFilePath = path.join(uploadsDir, 'full-test.mp4');
        fs.writeFileSync(testFilePath, Buffer.alloc(512, 0));

        const video = await Video.create({
            title: 'Full Stream',
            originalName: 'full.mp4',
            filePath: testFilePath,
            mimeType: 'video/mp4',
            size: 512,
            status: 'completed',
            classification: 'safe',
            uploadedBy: user._id,
            organizationId: user.organizationId,
        });

        const res = await request(app)
            .get(`/api/videos/${video._id}/stream?token=${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('video/mp4');

        fs.unlinkSync(testFilePath);
    });

    it('should reject streaming for unauthorized user', async () => {
        const { user } = await createTestUser({ email: 'owner@test.com' });
        const { token: otherToken } = await createTestUser({ email: 'other@test.com' });

        const video = await Video.create({
            title: 'Private',
            originalName: 'private.mp4',
            filePath: '/fake',
            mimeType: 'video/mp4',
            size: 100,
            status: 'completed',
            classification: 'safe',
            uploadedBy: user._id,
            organizationId: user.organizationId,
        });

        const res = await request(app)
            .get(`/api/videos/${video._id}/stream?token=${otherToken}`);

        expect(res.statusCode).toBe(403);
    });
});
