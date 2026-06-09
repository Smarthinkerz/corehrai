import { db } from './db';
import { employees, surveyResponses } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Checking for employee with ID 2:');
  try {
    const result = await db.select().from(employees).where(eq(employees.id, 2));
    console.log(result);
  } catch (error) {
    console.error('Error querying employee with ID 2:', error);
  }
  
  console.log('\nAll employees:');
  try {
    const allEmployees = await db.select().from(employees);
    console.log(allEmployees);
  } catch (error) {
    console.error('Error querying all employees:', error);
  }
  
  console.log('\nAll survey responses:');
  try {
    const allResponses = await db.select().from(surveyResponses);
    console.log(JSON.stringify(allResponses, null, 2));
  } catch (error) {
    console.error('Error querying survey responses:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));