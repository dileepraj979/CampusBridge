import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'campusbridge_super_secret_access_jwt_key_2025_prod_grade';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'campusbridge_super_secret_refresh_jwt_key_2025_prod_grade';

export function signAccessToken(user, activeRoleAssignment) {
  const collegeIdStr = activeRoleAssignment?.collegeId?._id
    ? activeRoleAssignment.collegeId._id.toString()
    : activeRoleAssignment?.collegeId
      ? activeRoleAssignment.collegeId.toString()
      : null;

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      activeRole: user.activeRole,
      collegeId: collegeIdStr,
      departmentId: activeRoleAssignment?.departmentId || null,
      classId: activeRoleAssignment?.classId || null,
      tokenVersion: user.tokenVersion
    },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion
    },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export const REFRESH_COOKIE_NAME = 'cb_refresh_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
