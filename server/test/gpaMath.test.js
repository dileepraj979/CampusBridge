import { describe, it, expect } from 'vitest';

/**
 * Institutional Grade Point Mapping (R22 Regulations)
 */
const GRADE_POINT_MAP = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0
};

/**
 * Calculates Semester Grade Point Average (SGPA)
 * Formula: SGPA = sum(Credits_i * GradePoints_i) / sum(Credits_i)
 */
export function calculateSGPA(courses) {
  if (!courses || courses.length === 0) return 0.0;

  let totalCredits = 0;
  let weightedPoints = 0;

  for (const course of courses) {
    const credits = course.credits || 0;
    const grade = (course.grade || 'F').toUpperCase();
    const points = GRADE_POINT_MAP[grade] !== undefined ? GRADE_POINT_MAP[grade] : 0;

    totalCredits += credits;
    weightedPoints += credits * points;
  }

  if (totalCredits === 0) return 0.0;
  return Math.round((weightedPoints / totalCredits) * 100) / 100;
}

/**
 * Calculates Cumulative Grade Point Average (CGPA)
 * Formula: CGPA = sum(SemesterCredits_j * SGPA_j) / sum(SemesterCredits_j)
 */
export function calculateCGPA(semesters) {
  if (!semesters || semesters.length === 0) return 0.0;

  let totalCredits = 0;
  let weightedSgpa = 0;

  for (const sem of semesters) {
    const credits = sem.credits || 0;
    const sgpa = sem.sgpa || 0.0;

    totalCredits += credits;
    weightedSgpa += credits * sgpa;
  }

  if (totalCredits === 0) return 0.0;
  return Math.round((weightedSgpa / totalCredits) * 100) / 100;
}

describe('Institutional GPA Math & Credit Weightage Engine', () => {
  it('correctly calculates SGPA with perfect O grades (10.0)', () => {
    const courses = [
      { code: 'CS301', credits: 4, grade: 'O' },
      { code: 'CS302', credits: 4, grade: 'O' },
      { code: 'CS303', credits: 3, grade: 'O' },
      { code: 'CS305', credits: 1.5, grade: 'O' }
    ];
    expect(calculateSGPA(courses)).toBe(10.0);
  });

  it('correctly computes weighted SGPA with mixed letter grades and lab credits', () => {
    // Total Credits: 4 + 4 + 3 + 1.5 = 12.5
    // Weighted: (4 * 10) + (4 * 9) + (3 * 8) + (1.5 * 10) = 40 + 36 + 24 + 15 = 115
    // SGPA = 115 / 12.5 = 9.20
    const courses = [
      { code: 'CS301', credits: 4, grade: 'O' },  // 10 pts -> 40
      { code: 'CS302', credits: 4, grade: 'A+' }, // 9 pts  -> 36
      { code: 'CS303', credits: 3, grade: 'A' },  // 8 pts  -> 24
      { code: 'CS305', credits: 1.5, grade: 'O' } // 10 pts -> 15
    ];
    expect(calculateSGPA(courses)).toBe(9.2);
  });

  it('calculates 0.0 when student has F grades in all registered subjects', () => {
    const courses = [
      { code: 'CS301', credits: 4, grade: 'F' },
      { code: 'CS302', credits: 4, grade: 'F' }
    ];
    expect(calculateSGPA(courses)).toBe(0.0);
  });

  it('handles empty course list or zero credits gracefully without NaN', () => {
    expect(calculateSGPA([])).toBe(0.0);
    expect(calculateSGPA([{ credits: 0, grade: 'O' }])).toBe(0.0);
  });

  it('correctly aggregates multi-semester CGPA with varying credit distributions', () => {
    // Sem 1: 20 credits, SGPA 8.5 -> 170
    // Sem 2: 22 credits, SGPA 9.0 -> 198
    // Sem 3: 24 credits, SGPA 9.25 -> 222
    // Sem 4: 24 credits, SGPA 9.5 -> 228
    // Total credits = 90
    // Total weighted = 170 + 198 + 222 + 228 = 818
    // CGPA = 818 / 90 = 9.0888... -> 9.09
    const semesters = [
      { semester: 1, credits: 20, sgpa: 8.5 },
      { semester: 2, credits: 22, sgpa: 9.0 },
      { semester: 3, credits: 24, sgpa: 9.25 },
      { semester: 4, credits: 24, sgpa: 9.5 }
    ];
    expect(calculateCGPA(semesters)).toBe(9.09);
  });
});
