const request = require('supertest');
const { app } = require('../server');
const { connectTestDB, cleanDB, disconnectDB, createTestUser } = require('./setup');

beforeAll(async () => {
    await connectTestDB();
});

afterEach(async () => {
    await cleanDB();
});

afterAll(async () => {
    await disconnectDB();
});

describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                organizationId: 'acme-corp',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.name).toBe('John Doe');
        expect(res.body.user.email).toBe('john@example.com');
        expect(res.body.user.role).toBe('editor');
        expect(res.body.user.organizationId).toBe('acme-corp');
    });

    it('should reject registration with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'john@example.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should reject duplicate email registration', async () => {
        await request(app).post('/api/auth/register').send({
            name: 'User One',
            email: 'duplicate@example.com',
            password: 'password123',
            organizationId: 'org1',
        });

        const res = await request(app).post('/api/auth/register').send({
            name: 'User Two',
            email: 'duplicate@example.com',
            password: 'password456',
            organizationId: 'org2',
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/already registered/i);
    });
});

describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {

        await request(app).post('/api/auth/register').send({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
            organizationId: 'org1',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jane@example.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should reject invalid password', async () => {
        await request(app).post('/api/auth/register').send({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
            organizationId: 'org1',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jane@example.com', password: 'wrongpassword' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'password123' });

        expect(res.statusCode).toBe(401);
    });
});

describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
        const { token } = await createTestUser();

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user).toHaveProperty('email');
    });

    it('should reject request without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken123');

        expect(res.statusCode).toBe(401);
    });
});
