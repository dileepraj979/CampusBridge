import Device from '../models/Device.js';
import { AppError } from '../middleware/errorHandler.js';

export async function registerDevice(req, res, next) {
  try {
    const { deviceFingerprint, deviceName, browser, os, offlineCapabilities, cachedStores } = req.body;

    if (!deviceFingerprint) {
      throw new AppError('deviceFingerprint is required', 400, 'MISSING_FINGERPRINT');
    }

    const device = await Device.findOneAndUpdate(
      { userId: req.user._id, deviceFingerprint },
      {
        deviceName: deviceName || 'Offline Browser Client',
        browser: browser || req.headers['user-agent'] || 'Modern Browser',
        os: os || 'Desktop',
        offlineCapabilities: offlineCapabilities ?? true,
        cachedStores: cachedStores || [],
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
        lastSyncAt: new Date(),
        revokedAt: null
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: device,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function listUserDevices(req, res, next) {
  try {
    const devices = await Device.find({ userId: req.user._id })
      .sort({ lastSyncAt: -1 })
      .lean();

    res.json({
      success: true,
      data: devices,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeDevice(req, res, next) {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    device.revokedAt = new Date();
    await device.save();

    res.json({
      success: true,
      data: {
        message: 'Device revoked from offline synchronization',
        deviceId: device._id
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
