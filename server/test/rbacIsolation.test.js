import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import User from '../src/models/User.js';
import { signAccessToken } from '../src/utils/tokens.js';
import { connectDB } from '../src/config/db.js';

describe('RBAC Isolation & Access Enforcement Integration Tests', () => {
  let studentToken;
  let facultyToken;
  let principalToken;

  beforeAll(async () => {
    await connectDB();
    // Locate or create test tokens using existing seeded users
    const studentUser = await User.findOne({ email: 'student.cse@ait.edu' });
    const facultyUser = await User.findOne({ email: 'faculty.cse@ait.edu' });
    const principalUser = await User.findOne({ email: 'principal@ait.edu' });

    if (studentUser) {
      studentToken = signAccessToken(studentUser, studentUser.roles[0]);
    }
    if (facultyUser) {
      facultyToken = signAccessToken(facultyUser, facultyUser.roles[0]);
    }
    if (principalUser) {
      principalToken = signAccessToken(principalUser, principalUser.roles[0]);
    }
  });

  it('rejects unauthenticated requests to protected intelligence endpoints with 401', async () => {
    const res = await request(app).get('/api/intelligence/early-warning');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('strictly forbids students from accessing confidential mentoring/counseling notes with 403', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get('/api/intelligence/counseling-notes')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_COUNSELING_ACCESS');
  });

  it('strictly forbids students from dispatching campus emergency broadcasts with 403', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Emergency Notice',
        message: 'This should be rejected by server RBAC.'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_BROADCAST');
  });

  it('permits authorized faculty to access Early-Warning Dashboard', async () => {
    if (!facultyToken) return;
    const res = await request(app)
      .get('/api/intelligence/early-warning')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.students).toBeDefined();
    expect(Array.isArray(res.body.students)).toBe(true);
  });

  it('permits institutional leadership (Principal) to read counseling notes', async () => {
    if (!principalToken) return;
    const res = await request(app)
      .get('/api/intelligence/counseling-notes')
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
