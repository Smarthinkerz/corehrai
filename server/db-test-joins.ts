import { db } from './db';
import { employees, surveyResponses } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Testing employee JOIN with survey responses:');
  try {
    const responses = await db
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        employeeId: surveyResponses.employeeId,
        responses: surveyResponses.responses,
        sentimentScore: surveyResponses.sentimentScore,
        submittedAt: surveyResponses.submittedAt,
        // Get employee data if available
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department
      })
      .from(surveyResponses)
      .leftJoin(employees, eq(surveyResponses.employeeId, employees.id));
    
    console.log(JSON.stringify(responses, null, 2));
  } catch (error) {
    console.error('Error testing joins:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));