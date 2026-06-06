/**
 * Data Sanitization Service
 * 
 * When returning data to inspectors, strip CV data and sensitive personal information
 * while retaining allowed fields for supervision purposes.
 * 
 * Requirements: 3.4
 */

export interface RecruitedCandidateRaw {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  recruitmentDate?: Date;
  enterpriseId?: string;
  // Sensitive fields that should be removed
  cv_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  carte_handicap_url?: string;
  video_cv_url?: string;
  photo_profil_url?: string;
  [key: string]: any; // Allow other fields
}

export interface RecruitedCandidateForInspector {
  id: string;
  firstName: string;
  jobTitle: string;
  recruitmentDate: Date;
  enterpriseId: string;
  // CV, full profile, contact info EXCLUDED
}

/**
 * Sanitize recruited candidate data for inspector viewing
 * 
 * Removes:
 * - CV (cv_url, video_cv_url)
 * - Full profile (photo_profil_url, carte_handicap_url)
 * - Contact info (email, phone, address, dateOfBirth)
 * 
 * Retains:
 * - id, firstName, jobTitle, recruitmentDate, enterpriseId
 * 
 * @param candidates - Raw candidate data from database
 * @returns Sanitized data safe for inspector viewing
 */
export function sanitizeRecruitedCandidatesForInspector(
  candidates: RecruitedCandidateRaw[]
): RecruitedCandidateForInspector[] {
  return candidates.map(candidate => ({
    id: candidate.id,
    firstName: candidate.firstName || candidate.fullName?.split(" ")[0] || "Unknown",
    jobTitle: candidate.jobTitle || "N/A",
    recruitmentDate: candidate.recruitmentDate || new Date(),
    enterpriseId: candidate.enterpriseId || "Unknown",
  }));
}

/**
 * Sanitize any user data object for inspector viewing
 * 
 * @param data - Raw user data
 * @returns Sanitized data with sensitive fields removed
 */
export function sanitizeUserDataForInspector(data: any): any {
  const sensitiveFields = [
    "cv_url",
    "video_cv_url",
    "photo_profil_url",
    "carte_handicap_url",
    "email",
    "phone",
    "telephone",
    "address",
    "adresse",
    "dateOfBirth",
    "date_naissance",
    "password",
    "mot_de_passe",
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeUserDataForInspector(item));
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      if (!sensitiveFields.includes(key)) {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  return data;
}
