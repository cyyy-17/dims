import Papa from 'papaparse';
import { Dormer, DormerType } from './types';

export const CSV_TEMPLATES: Record<DormerType, string> = {
  student: `student_id_no,first_name,last_name,email,contact_no,gender,emergency_name,emergency_contact,emergency_relationship,year_level,section,course
STU-2026-001,Lucas,Santos,lucas.santos@student.school.edu.ph,+639171234567,male,Maria Santos,+639181234567,Mother,3rd Year,BSIT-3A,BS Information Technology
STU-2026-002,Sophia,Reyes,sophia.reyes@student.school.edu.ph,+639172345678,female,Eduardo Reyes,+639182345678,Father,2nd Year,BSN-2B,BS Nursing`,

  employee: `employee_id_no,first_name,last_name,email,contact_no,gender,emergency_name,emergency_contact,emergency_relationship,department,position
EMP-2026-101,Dr. Marcus,Villar,marcus.villar@school.edu.ph,+639201112233,male,Elena Villar,+639209998877,Spouse,College of Science,Associate Professor
EMP-2026-102,Carmela,Dela Cruz,carmela.delacruz@school.edu.ph,+639203334455,female,Ramon Dela Cruz,+639208887766,Brother,ASR Services,Administrative Coordinator`,

  visitor: `external_id,first_name,last_name,email,contact_no,gender,emergency_name,emergency_contact,emergency_relationship,organization,purpose_of_stay,expected_departure
VIS-2026-901,Prof. David,Kim,d.kim@intl-research.org,+821012345678,male,Sarah Kim,+821098765432,Spouse,Seoul University,Visiting Scholar & Collaborative Research,2026-10-15
VIS-2026-902,Elena,Rostova,elena.rostova@unesco-eval.org,+33612345678,female,Pavel Rostov,+33698765432,Father,UNESCO Education Review,Campus Academic Accreditation Inspection,2026-09-30`,
};

export function downloadCsvTemplate(type: DormerType) {
  const content = CSV_TEMPLATES[type];
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dims_${type}_import_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedDormerRow {
  isValid: boolean;
  errors: string[];
  data: Partial<Dormer>;
  rawData: Record<string, string>;
}

export function parseDormerCsv(
  csvInput: string | File,
  targetType: DormerType
): Promise<{ rows: ParsedDormerRow[]; totalValid: number; totalInvalid: number }> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(csvInput as unknown as string, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows: ParsedDormerRow[] = [];
        let validCount = 0;
        let invalidCount = 0;

        results.data.forEach((row, index) => {
          const errors: string[] = [];
          const firstName = (row['first_name'] || row['First Name'] || '').trim();
          const lastName = (row['last_name'] || row['Last Name'] || '').trim();
          const email = (row['email'] || row['Email'] || '').trim();
          const contactNo = (row['contact_no'] || row['Contact No'] || row['phone'] || '').trim();
          const emergencyName = (row['emergency_name'] || row['Emergency Contact Name'] || '').trim();
          const emergencyContact = (row['emergency_contact'] || row['Emergency Phone'] || '').trim();
          const emergencyRelationship = (row['emergency_relationship'] || '').trim();
          const genderRaw = (row['gender'] || 'prefer_not_to_say').toLowerCase().trim();
          const gender = genderRaw === 'male' || genderRaw === 'female' ? genderRaw : 'prefer_not_to_say';

          if (!firstName) errors.push(`Row ${index + 1}: First Name is required`);
          if (!lastName) errors.push(`Row ${index + 1}: Last Name is required`);
          if (!email || !email.includes('@')) errors.push(`Row ${index + 1}: Valid Email is required`);
          if (!contactNo) errors.push(`Row ${index + 1}: Contact Number is required`);
          if (!emergencyName) errors.push(`Row ${index + 1}: Emergency Contact Name is required`);
          if (!emergencyContact) errors.push(`Row ${index + 1}: Emergency Phone Number is required`);

          const dormerData: Partial<Dormer> = {
            id: `dormer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: targetType,
            firstName,
            lastName,
            email,
            contactNo,
            gender: gender as Dormer['gender'],
            emergencyName,
            emergencyContact,
            emergencyRelationship,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (targetType === 'student') {
            const studentId = (row['student_id_no'] || row['Student ID'] || `STU-${Date.now()}`).trim();
            dormerData.studentIdNo = studentId;
            dormerData.yearLevel = (row['year_level'] || '1st Year').trim();
            dormerData.section = (row['section'] || 'Sec-A').trim();
            dormerData.course = (row['course'] || 'General Studies').trim();
          } else if (targetType === 'employee') {
            const employeeId = (row['employee_id_no'] || row['Employee ID'] || `EMP-${Date.now()}`).trim();
            dormerData.employeeIdNo = employeeId;
            dormerData.department = (row['department'] || 'Academic Affairs').trim();
            dormerData.position = (row['position'] || 'Staff').trim();
          } else if (targetType === 'visitor') {
            dormerData.externalId = (row['external_id'] || `VIS-${Date.now()}`).trim();
            dormerData.organization = (row['organization'] || 'Guest Institution').trim();
            dormerData.purposeOfStay = (row['purpose_of_stay'] || 'Campus Academic Visit').trim();
            dormerData.expectedDeparture = (row['expected_departure'] || '').trim();
          }

          const isValid = errors.length === 0;
          if (isValid) validCount++;
          else invalidCount++;

          parsedRows.push({
            isValid,
            errors,
            data: dormerData,
            rawData: row,
          });
        });

        resolve({
          rows: parsedRows,
          totalValid: validCount,
          totalInvalid: invalidCount,
        });
      },
    });
  });
}
