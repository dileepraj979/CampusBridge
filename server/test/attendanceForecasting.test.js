import { describe, it, expect } from 'vitest';

/**
 * Attendance Forecasting & Condonation Forecaster
 */
export function forecastAttendance({ presentCount, totalHeld, targetPct = 75 }) {
  if (totalHeld <= 0) {
    return {
      currentPct: 100,
      status: 'SUFFICIENT',
      classesToAttend: 0,
      safeMissesAllowed: 0
    };
  }

  const theta = targetPct / 100;
  const currentPct = Math.round((presentCount / totalHeld) * 1000) / 10;

  if (currentPct < targetPct) {
    // Required upcoming consecutive classes to reach target
    // (P + X) / (T + X) >= theta => X >= (theta * T - P) / (1 - theta)
    const needed = Math.ceil((theta * totalHeld - presentCount) / (1 - theta));
    return {
      currentPct,
      status: 'SHORTAGE',
      classesToAttend: Math.max(0, needed),
      safeMissesAllowed: 0
    };
  } else {
    // Number of future classes student can miss while remaining >= target
    // P / (T + Y) >= theta => Y <= (P - theta * T) / theta
    const misses = Math.floor((presentCount - theta * totalHeld) / theta);
    return {
      currentPct,
      status: 'SUFFICIENT',
      classesToAttend: 0,
      safeMissesAllowed: Math.max(0, misses)
    };
  }
}

describe('Attendance Forecasting & Shortage Recovery Engine', () => {
  it('correctly calculates 100% attendance and future safe misses allowed', () => {
    // 40 attended out of 40 held
    // Can miss Y classes: Y <= (40 - 0.75 * 40) / 0.75 = (40 - 30) / 0.75 = 10 / 0.75 = 13.33 => 13 classes
    const res = forecastAttendance({ presentCount: 40, totalHeld: 40, targetPct: 75 });
    expect(res.currentPct).toBe(100);
    expect(res.status).toBe('SUFFICIENT');
    expect(res.classesToAttend).toBe(0);
    expect(res.safeMissesAllowed).toBe(13);
  });

  it('correctly calculates consecutive classes needed when below statutory 75%', () => {
    // 25 attended out of 40 held => 62.5%
    // Needs X: X >= (0.75 * 40 - 25) / (1 - 0.75) = (30 - 25) / 0.25 = 5 / 0.25 = 20 classes
    // Verification: (25 + 20) / (40 + 20) = 45 / 60 = 75.0%
    const res = forecastAttendance({ presentCount: 25, totalHeld: 40, targetPct: 75 });
    expect(res.currentPct).toBe(62.5);
    expect(res.status).toBe('SHORTAGE');
    expect(res.classesToAttend).toBe(20);
    expect(res.safeMissesAllowed).toBe(0);
  });

  it('correctly handles borderline 75% exactly', () => {
    // 30 attended out of 40 held => 75.0%
    const res = forecastAttendance({ presentCount: 30, totalHeld: 40, targetPct: 75 });
    expect(res.currentPct).toBe(75);
    expect(res.status).toBe('SUFFICIENT');
    expect(res.classesToAttend).toBe(0);
    expect(res.safeMissesAllowed).toBe(0); // missing even 1 will drop below 75%
  });

  it('handles zero classes held gracefully', () => {
    const res = forecastAttendance({ presentCount: 0, totalHeld: 0, targetPct: 75 });
    expect(res.currentPct).toBe(100);
    expect(res.classesToAttend).toBe(0);
  });
});
