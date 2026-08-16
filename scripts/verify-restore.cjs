const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require(path.resolve(__dirname, '../backend/node_modules/pg'));

async function testRestore() {
  const adminClient = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  await adminClient.connect();
  
  try {
    await adminClient.query('DROP DATABASE IF EXISTS quran_forum_restore_verify;');
    await adminClient.query('CREATE DATABASE quran_forum_restore_verify;');
  } finally {
    await adminClient.end();
  }

  // Find latest dump file in backups directory
  const backupsDir = path.resolve(__dirname, '../backups');
  const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.dump')).sort().reverse();
  if (files.length === 0) {
    throw new Error('No .dump backup file found in backups directory');
  }
  const dumpPath = path.join(backupsDir, files[0]);
  console.log(`Using backup file: ${dumpPath}`);

  console.log('Restoring dump into quran_forum_restore_verify...');
  execSync(`"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe" -U postgres -h localhost -d quran_forum_restore_verify --no-owner --no-privileges "${dumpPath}"`, { stdio: 'inherit' });

  const mainClient = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/quran_forum' });
  const verifyClient = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/quran_forum_restore_verify' });
  await mainClient.connect();
  await verifyClient.connect();

  const tables = [
    'User',
    'Halaqa',
    'StudentProfile',
    'TeacherProfile',
    'SupervisorProfile',
    'ParentProfile',
    'AttendanceRecord',
    'MemorizationRecord',
    'RevisionRecord',
    'Exam',
    'ExamResult',
    'StudentEvaluation',
    'Notification',
    'ChatMessage',
    'Activity',
    'Award',
    'AdministrativeRequest',
    'AdminDecision',
    'AdminAlert'
  ];

  console.log('==================================================');
  console.log('TABLE NAME               | ORIGINAL | RESTORED | RESULT');
  console.log('==================================================');

  let allMatched = true;
  for (const table of tables) {
    const origRes = await mainClient.query(`SELECT count(*)::int as c FROM "${table}"`);
    const restRes = await verifyClient.query(`SELECT count(*)::int as c FROM "${table}"`);
    const origCount = origRes.rows[0].c;
    const restCount = restRes.rows[0].c;
    const match = origCount === restCount;
    if (!match) allMatched = false;
    console.log(`${table.padEnd(24)} | ${String(origCount).padEnd(8)} | ${String(restCount).padEnd(8)} | ${match ? 'PASS' : 'FAIL'}`);
  }
  console.log('==================================================');
  console.log('RESTORE VERIFICATION STATUS:', allMatched ? 'PASS' : 'FAIL');

  await mainClient.end();
  await verifyClient.end();

  const cleanClient = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  await cleanClient.connect();
  await cleanClient.query('DROP DATABASE IF EXISTS quran_forum_restore_verify;');
  await cleanClient.end();
  console.log('Temporary verification database dropped safely.');

  if (!allMatched) {
    process.exit(1);
  }
}

testRestore().catch(err => {
  console.error('Restore verification error:', err);
  process.exit(1);
});
