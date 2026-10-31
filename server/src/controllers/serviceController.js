import crypto from 'crypto';
import ServiceRequest from '../models/ServiceRequest.js';
import Grievance from '../models/Grievance.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Multi-stage workflow definitions tailored by request type
 */
function buildApprovalStages(requestType, classId = 'CS-3A', departmentId = 'CSE') {
  switch (requestType) {
    case 'STUDENT_LEAVE':
      return [
        { stageNumber: 1, stageName: 'Class Advisor / Proctor Review', approverRole: 'CLASS_ADVISOR', status: 'PENDING' },
        { stageNumber: 2, stageName: 'Head of Department Approval', approverRole: 'HOD', status: 'PENDING' }
      ];
    case 'FACULTY_LEAVE':
      return [
        { stageNumber: 1, stageName: 'Department HOD Recommendation', approverRole: 'HOD', status: 'PENDING' },
        { stageNumber: 2, stageName: 'Dean / Principal Sanction', approverRole: 'PRINCIPAL', status: 'PENDING' }
      ];
    case 'ATTENDANCE_CORRECTION':
      return [
        { stageNumber: 1, stageName: 'Subject Faculty Verification', approverRole: 'FACULTY', status: 'PENDING' },
        { stageNumber: 2, stageName: 'HOD Audit & Confirmation', approverRole: 'HOD', status: 'PENDING' }
      ];
    case 'BONAFIDE_CERTIFICATE':
      return [
        { stageNumber: 1, stageName: 'Class Advisor Verification', approverRole: 'CLASS_ADVISOR', status: 'PENDING' },
        { stageNumber: 2, stageName: 'Academic Section Issuance', approverRole: 'COLLEGE_ADMIN', status: 'PENDING' }
      ];
    case 'TRANSCRIPT_ISSUANCE':
    case 'FEE_CONCESSION':
      return [
        { stageNumber: 1, stageName: 'Department HOD Endorsement', approverRole: 'HOD', status: 'PENDING' },
        { stageNumber: 2, stageName: 'Institutional Dean / Principal Approval', approverRole: 'PRINCIPAL', status: 'PENDING' },
        { stageNumber: 3, stageName: 'Finance & Administration Fulfillment', approverRole: 'COLLEGE_ADMIN', status: 'PENDING' }
      ];
    default:
      return [
        { stageNumber: 1, stageName: 'Administrative Review', approverRole: 'COLLEGE_ADMIN', status: 'PENDING' }
      ];
  }
}

/**
 * GET /api/services/requests
 * List service requests filtered by role, status, or user
 */
export async function getServiceRequests(req, res, next) {
  try {
    const { requestType, overallStatus, classId } = req.query;
    const filter = {};

    if (requestType) filter.requestType = requestType;
    if (overallStatus) filter.overallStatus = overallStatus;
    if (classId) filter.classId = classId;

    // Non-admin/non-HOD students see only their own requests
    const userRole = req.authRole || req.user.activeRole;
    if (userRole === 'STUDENT') {
      filter.requesterId = req.user._id;
    }

    let requests = await ServiceRequest.find(filter).sort({ createdAt: -1 }).lean();

    // Seed realistic service requests if none exist
    if (requests.length === 0 && (!userRole || userRole !== 'STUDENT')) {
      const sample = [
        {
          ticketNumber: 'SR-2026-8812',
          requestType: 'BONAFIDE_CERTIFICATE',
          requesterId: req.user._id,
          requesterName: 'Aarav Sharma',
          requesterRole: 'STUDENT',
          requesterEmail: 'student.cse@ait.edu',
          departmentId: 'CSE',
          classId: 'CS-3A',
          title: 'Request for Autonomous Bonafide for Passport & Education Loan',
          description: 'Need official bonafide letter addressed to State Bank of India with current semester enrollment details.',
          priority: 'MEDIUM',
          slaHours: 48,
          slaDeadline: new Date(Date.now() + 36 * 3600000),
          isSlaBreached: false,
          stages: [
            { stageNumber: 1, stageName: 'Class Advisor Verification', approverRole: 'CLASS_ADVISOR', status: 'APPROVED', actionDate: new Date(), actionTakenByName: 'Prof. Ananya Sen', remarks: 'Good academic standing verified.' },
            { stageNumber: 2, stageName: 'Academic Section Issuance', approverRole: 'COLLEGE_ADMIN', status: 'PENDING' }
          ],
          currentStageIndex: 1,
          overallStatus: 'IN_REVIEW',
          auditHistory: [
            { action: 'REQUEST_SUBMITTED', actorName: 'Aarav Sharma', actorRole: 'STUDENT', comment: 'Initiated request online' },
            { action: 'STAGE_1_APPROVED', actorName: 'Prof. Ananya Sen', actorRole: 'CLASS_ADVISOR', comment: 'Endorsed for bank processing' }
          ]
        },
        {
          ticketNumber: 'SR-2026-9043',
          requestType: 'STUDENT_LEAVE',
          requesterId: req.user._id,
          requesterName: 'Bhavin Patel',
          requesterRole: 'STUDENT',
          requesterEmail: 'bhavin.patel@ait.edu',
          departmentId: 'CSE',
          classId: 'CS-3A',
          title: 'On-Duty Leave for Smart India Hackathon Grand Finale',
          description: 'Representing college at New Delhi Hackathon hub from Nov 12 to Nov 15.',
          priority: 'HIGH',
          slaHours: 24,
          slaDeadline: new Date(Date.now() + 12 * 3600000),
          isSlaBreached: false,
          stages: [
            { stageNumber: 1, stageName: 'Class Advisor / Proctor Review', approverRole: 'CLASS_ADVISOR', status: 'APPROVED', actionDate: new Date(), actionTakenByName: 'Prof. Ananya Sen', remarks: 'Team leader confirmed.' },
            { stageNumber: 2, stageName: 'Head of Department Approval', approverRole: 'HOD', status: 'APPROVED', actionDate: new Date(), actionTakenByName: 'Dr. Aris Thorne', remarks: 'Sanctioned with On-Duty attendance credit.' }
          ],
          currentStageIndex: 1,
          overallStatus: 'APPROVED',
          auditHistory: [
            { action: 'REQUEST_SUBMITTED', actorName: 'Bhavin Patel', actorRole: 'STUDENT', comment: 'Filed team travel schedule' },
            { action: 'STAGE_1_APPROVED', actorName: 'Prof. Ananya Sen', actorRole: 'CLASS_ADVISOR', comment: 'All lab submissions up to date' },
            { action: 'STAGE_2_APPROVED', actorName: 'Dr. Aris Thorne', actorRole: 'HOD', comment: 'OD leave sanctioned' }
          ]
        }
      ];

      await ServiceRequest.insertMany(sample);
      requests = await ServiceRequest.find(filter).sort({ createdAt: -1 }).lean();
    }

    // Dynamic SLA breach check
    const now = new Date();
    requests = requests.map(r => ({
      ...r,
      isSlaBreached: r.overallStatus !== 'APPROVED' && r.overallStatus !== 'FULFILLED' && new Date(r.slaDeadline) < now
    }));

    res.json({
      success: true,
      data: requests,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/services/requests
 * Submit new service request
 */
export async function createServiceRequest(req, res, next) {
  try {
    const {
      requestType,
      title,
      description = '',
      details = {},
      priority = 'MEDIUM',
      slaHours = 48,
      attachments = []
    } = req.body;

    if (!requestType || !title) {
      throw new AppError('requestType and title are required', 400, 'MISSING_FIELDS');
    }

    const ticketNumber = `SR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);
    const stages = buildApprovalStages(requestType, req.user.classId, req.user.departmentId);

    const serviceReq = new ServiceRequest({
      ticketNumber,
      requestType,
      requesterId: req.user._id,
      requesterName: req.user.name,
      requesterRole: req.authRole || req.user.activeRole,
      requesterEmail: req.user.email,
      departmentId: req.user.departmentId || 'CSE',
      classId: req.user.classId || 'CS-3A',
      title,
      description,
      details,
      priority,
      slaHours,
      slaDeadline,
      stages,
      currentStageIndex: 0,
      overallStatus: 'SUBMITTED',
      attachments,
      auditHistory: [{
        action: 'REQUEST_SUBMITTED',
        actorName: req.user.name,
        actorRole: req.authRole || req.user.activeRole,
        comment: 'Initial service ticket generated'
      }]
    });

    await serviceReq.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'SERVICE_REQUEST_CREATED',
      entity: 'ServiceRequest',
      entityId: ticketNumber,
      changes: { requestType, priority, slaDeadline },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: `Service ticket ${ticketNumber} created successfully.`,
      data: serviceReq,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/services/requests/:ticketNumber/approve
 * Approver approves the current stage
 */
export async function approveServiceRequestStage(req, res, next) {
  try {
    const { ticketNumber } = req.params;
    const { remarks = '' } = req.body;
    const userRole = req.authRole || req.user.activeRole;

    const request = await ServiceRequest.findOne({ ticketNumber });
    if (!request) {
      throw new AppError('Service request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.overallStatus === 'APPROVED' || request.overallStatus === 'REJECTED') {
      throw new AppError(`Cannot advance request in ${request.overallStatus} state`, 400, 'INVALID_STATE');
    }

    const currentStage = request.stages[request.currentStageIndex];
    if (!currentStage) {
      throw new AppError('No pending approval stage found', 400, 'NO_PENDING_STAGE');
    }

    // Role verification (Super Admin and College Admin have universal override)
    const isAuthorized =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'COLLEGE_ADMIN' ||
      userRole === currentStage.approverRole ||
      (currentStage.approverRole === 'HOD' && (userRole === 'HOD' || userRole === 'PRINCIPAL')) ||
      (currentStage.approverRole === 'CLASS_ADVISOR' && (userRole === 'CLASS_ADVISOR' || userRole === 'FACULTY' || userRole === 'HOD'));

    if (!isAuthorized) {
      throw new AppError(`Unauthorized: Role ${userRole} cannot approve stage '${currentStage.stageName}'`, 403, 'FORBIDDEN_APPROVER');
    }

    // Update stage status
    currentStage.status = 'APPROVED';
    currentStage.actionTakenBy = req.user._id;
    currentStage.actionTakenByName = req.user.name;
    currentStage.actionDate = new Date();
    currentStage.remarks = remarks;

    request.auditHistory.push({
      action: `STAGE_${currentStage.stageNumber}_APPROVED`,
      actorName: req.user.name,
      actorRole: userRole,
      comment: remarks || `Approved by ${userRole}`
    });

    // Check if more stages remain
    if (request.currentStageIndex + 1 < request.stages.length) {
      request.currentStageIndex += 1;
      request.overallStatus = 'IN_REVIEW';
    } else {
      request.overallStatus = 'APPROVED';
    }

    await request.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole,
      action: 'SERVICE_REQUEST_STAGE_APPROVED',
      entity: 'ServiceRequest',
      entityId: ticketNumber,
      changes: { stage: currentStage.stageName, overallStatus: request.overallStatus },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `Stage '${currentStage.stageName}' approved. Overall status: ${request.overallStatus}`,
      data: request,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/services/requests/:ticketNumber/reject
 * Approver rejects request at current stage
 */
export async function rejectServiceRequestStage(req, res, next) {
  try {
    const { ticketNumber } = req.params;
    const { remarks = 'Request rejected by approver' } = req.body;
    const userRole = req.authRole || req.user.activeRole;

    const request = await ServiceRequest.findOne({ ticketNumber });
    if (!request) {
      throw new AppError('Service request not found', 404, 'REQUEST_NOT_FOUND');
    }

    const currentStage = request.stages[request.currentStageIndex];
    if (currentStage) {
      currentStage.status = 'REJECTED';
      currentStage.actionTakenBy = req.user._id;
      currentStage.actionTakenByName = req.user.name;
      currentStage.actionDate = new Date();
      currentStage.remarks = remarks;
    }

    request.overallStatus = 'REJECTED';
    request.auditHistory.push({
      action: `STAGE_${currentStage?.stageNumber || 1}_REJECTED`,
      actorName: req.user.name,
      actorRole: userRole,
      comment: remarks
    });

    await request.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole,
      action: 'SERVICE_REQUEST_REJECTED',
      entity: 'ServiceRequest',
      entityId: ticketNumber,
      changes: { remarks },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `Service ticket ${ticketNumber} rejected.`,
      data: request,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/grievances
 * Privacy-isolated grievance list with access audit logging
 */
export async function getGrievances(req, res, next) {
  try {
    const userRole = req.authRole || req.user.activeRole;
    const isAuthorizedAuditor = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL'].includes(userRole);

    let filter = {};
    if (!isAuthorizedAuditor) {
      // Non-administrative users see only their own filed complaints
      filter = { complainantId: req.user._id };
    }

    let grievances = await Grievance.find(filter).sort({ createdAt: -1 }).lean();

    // Seed sample complaints if empty
    if (grievances.length === 0 && isAuthorizedAuditor) {
      const sampleGrievances = [
        {
          trackingNumber: 'GRV-2026-X89J2',
          isAnonymous: true,
          complainantId: null,
          complainantMaskedId: 'ANON-CITIZEN-042',
          category: 'INFRASTRUCTURE',
          severity: 'STANDARD',
          subject: 'Air Conditioning failure and projector flickering in CS Seminar Hall 2',
          details: 'During afternoon distributed systems lectures, the projector resets every 10 minutes and room temperature exceeds 33 degrees.',
          status: 'UNDER_INVESTIGATION',
          assignedCommittee: 'Campus Infrastructure & Maintenance Cell',
          escalationDeadline: new Date(Date.now() + 4 * 86400000),
          accessAudit: []
        },
        {
          trackingNumber: 'GRV-2026-P9901',
          isAnonymous: false,
          complainantId: req.user._id,
          complainantMaskedId: 'STU-****-089',
          category: 'HOSTEL_MESS',
          severity: 'STANDARD',
          subject: 'Drinking water RO plant filter hygiene inspection required at Aryabhata Hall',
          details: 'Water turbidity reported on floor 3 water dispenser. Requesting immediate bacteriological audit test.',
          status: 'FILED',
          assignedCommittee: 'Hostel Wardens & Health Inspection Board',
          escalationDeadline: new Date(Date.now() + 6 * 86400000),
          accessAudit: []
        }
      ];

      await Grievance.insertMany(sampleGrievances);
      grievances = await Grievance.find(filter).sort({ createdAt: -1 }).lean();
    }

    // If an authorized committee member viewed sensitive grievances, record an access audit
    if (isAuthorizedAuditor && grievances.length > 0) {
      await AuditLog.create({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole,
        action: 'CONFIDENTIAL_GRIEVANCE_ACCESSED',
        entity: 'Grievance',
        entityId: 'BATCH_VIEW',
        status: 'SUCCESS',
        requestId: req.id
      });
    }

    res.json({
      success: true,
      data: grievances,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/grievances
 * File a confidential grievance with anti-retaliation tracking ID
 */
export async function fileGrievance(req, res, next) {
  try {
    const {
      isAnonymous = false,
      category,
      severity = 'STANDARD',
      subject,
      details
    } = req.body;

    if (!category || !subject || !details) {
      throw new AppError('category, subject, and details are required', 400, 'MISSING_FIELDS');
    }

    const trackingNumber = `GRV-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const complainantMaskedId = isAnonymous
      ? `ANON-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
      : `STU-****-${req.user.studentProfile?.rollNo?.slice(-3) || '089'}`;

    const escalationDeadline = new Date(Date.now() + 7 * 86400000); // 7-day statutory escalation window

    let assignedCommittee = 'Campus Ombudsman';
    if (category === 'HARASSMENT_POSH') {
      assignedCommittee = 'Internal Complaints Committee (ICC) - Presiding Officer';
    } else if (category === 'INFRASTRUCTURE' || category === 'HOSTEL_MESS') {
      assignedCommittee = 'Campus Facilities & Hostel Oversight Board';
    }

    const grievance = new Grievance({
      trackingNumber,
      isAnonymous,
      complainantId: isAnonymous ? null : req.user._id,
      complainantMaskedId,
      category,
      severity,
      subject,
      details,
      status: 'FILED',
      assignedCommittee,
      escalationDeadline,
      accessAudit: [{
        accessedBy: req.user._id,
        accessedByName: isAnonymous ? 'Anonymous Complainant' : req.user.name,
        accessedByRole: req.authRole || req.user.activeRole,
        purpose: 'INITIAL_CONFIDENTIAL_SUBMISSION'
      }]
    });

    await grievance.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'GRIEVANCE_FILED',
      entity: 'Grievance',
      entityId: trackingNumber,
      changes: { category, severity, isAnonymous, assignedCommittee },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: `Confidential grievance registered. Tracking ID: ${trackingNumber}`,
      data: {
        trackingNumber,
        category,
        severity,
        assignedCommittee,
        status: grievance.status,
        escalationDeadline
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/grievances/:trackingNumber/resolve
 * Resolve a grievance with audit trail
 */
export async function resolveGrievance(req, res, next) {
  try {
    const { trackingNumber } = req.params;
    const { resolutionNotes = '' } = req.body;
    const userRole = req.authRole || req.user.activeRole;

    const grievance = await Grievance.findOne({ trackingNumber });
    if (!grievance) {
      throw new AppError('Grievance not found', 404, 'GRIEVANCE_NOT_FOUND');
    }

    grievance.status = 'RESOLVED';
    grievance.resolutionNotes = resolutionNotes;
    grievance.resolvedAt = new Date();
    await grievance.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole,
      action: 'GRIEVANCE_RESOLVED',
      entity: 'Grievance',
      entityId: trackingNumber,
      changes: { resolutionNotes },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `Grievance ${trackingNumber} marked as resolved.`,
      data: grievance,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
