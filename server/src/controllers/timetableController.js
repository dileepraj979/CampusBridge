import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/timetable/:classId
 */
export async function getClassTimetable(req, res, next) {
  try {
    const { classId = 'CS-3A' } = req.params;

    let timetable = await Timetable.findOne({ classId }).lean();

    // Default structure if not found
    if (!timetable) {
      timetable = {
        classId,
        departmentCode: 'CSE',
        semester: 5,
        academicYear: '2025-2026',
        slots: []
      };
    }

    res.json({
      success: true,
      data: timetable,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/timetable/faculty/:facultyId
 */
export async function getFacultyTimetable(req, res, next) {
  try {
    const { facultyId } = req.params;

    const timetables = await Timetable.find({
      'slots.facultyId': facultyId
    }).lean();

    const facultySlots = [];
    for (const tt of timetables) {
      for (const slot of tt.slots) {
        if (slot.facultyId && slot.facultyId.toString() === facultyId) {
          facultySlots.push({
            ...slot,
            classId: tt.classId,
            semester: tt.semester
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        facultyId,
        slots: facultySlots
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/timetable/slot
 * Add or update slot with strict faculty & room conflict checking
 */
export async function saveTimetableSlot(req, res, next) {
  try {
    const {
      classId,
      slotId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      subjectCode,
      subjectName,
      facultyId,
      facultyName,
      room,
      type = 'theory'
    } = req.body;

    if (!classId || !dayOfWeek || !periodNumber || !subjectCode || !room) {
      throw new AppError('classId, dayOfWeek, periodNumber, subjectCode, and room are required', 400, 'MISSING_SLOT_FIELDS');
    }

    // 1. Conflict Check: Is the Faculty already scheduled in another classroom in this slot?
    if (facultyId) {
      const facultyConflict = await Timetable.findOne({
        classId: { $ne: classId },
        slots: {
          $elemMatch: {
            dayOfWeek,
            periodNumber,
            facultyId
          }
        }
      }).lean();

      if (facultyConflict) {
        const conflictingSlot = facultyConflict.slots.find(
          s => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber && s.facultyId?.toString() === facultyId
        );
        throw new AppError(
          `Schedule Conflict: ${facultyName} is already assigned to ${facultyConflict.classId} (${conflictingSlot?.subjectCode || ''} in ${conflictingSlot?.room || ''}) on ${dayOfWeek} Period ${periodNumber}.`,
          409,
          'FACULTY_SCHEDULE_CONFLICT'
        );
      }
    }

    // 2. Conflict Check: Is the Room already booked by another class cohort in this slot?
    const roomConflict = await Timetable.findOne({
      classId: { $ne: classId },
      slots: {
        $elemMatch: {
          dayOfWeek,
          periodNumber,
          room
        }
      }
    }).lean();

    if (roomConflict) {
      const conflictingSlot = roomConflict.slots.find(
        s => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber && s.room === room
      );
      throw new AppError(
        `Room Allocation Conflict: Hall ${room} is already reserved by ${roomConflict.classId} (${conflictingSlot?.subjectCode || ''}) on ${dayOfWeek} Period ${periodNumber}.`,
        409,
        'ROOM_SCHEDULE_CONFLICT'
      );
    }

    // 3. Find or create class timetable
    let timetable = await Timetable.findOne({ classId });
    if (!timetable) {
      timetable = new Timetable({
        collegeId: req.scope?.collegeId || null,
        classId,
        departmentCode: 'CSE',
        semester: 5,
        academicYear: '2025-2026',
        slots: []
      });
    }

    // Remove existing slot in same classId, dayOfWeek, periodNumber if updating
    timetable.slots = timetable.slots.filter(
      s => !(s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber)
    );

    // Add new slot
    timetable.slots.push({
      slotId: slotId || `slot_${Date.now()}`,
      dayOfWeek,
      periodNumber,
      startTime: startTime || (periodNumber === 1 ? '09:30 AM' : periodNumber === 2 ? '10:30 AM' : periodNumber === 3 ? '11:45 AM' : periodNumber === 4 ? '01:30 PM' : '02:30 PM'),
      endTime: endTime || (periodNumber === 1 ? '10:30 AM' : periodNumber === 2 ? '11:30 AM' : periodNumber === 3 ? '12:45 PM' : periodNumber === 4 ? '02:30 PM' : '03:30 PM'),
      subjectCode,
      subjectName: subjectName || subjectCode,
      facultyId: facultyId || null,
      facultyName: facultyName || 'Faculty Professor',
      room,
      type
    });

    timetable.version += 1;
    await timetable.save();

    res.json({
      success: true,
      data: {
        message: 'Timetable slot scheduled successfully with verified room and faculty allocation',
        timetable
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
