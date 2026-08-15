import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PERMISSION_CATALOG, ROLE_PERMISSION_DEFAULTS } from '../src/authorization/permission-catalog';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const roles = [
  ['GENERAL_MANAGER', 'المدير العام'],
  ['EXECUTIVE_MANAGER', 'المدير التنفيذي'],
  ['TEACHER', 'المعلم'],
  ['TECHNICAL_SUPERVISOR', 'المشرف الفني'],
  ['STUDENT', 'الطالب'],
  ['PARENT', 'ولي الأمر'],
] as const;

async function main(): Promise<void> {
  const forum = await prisma.forum.upsert({
    where: { slug: 'demo-quran-forum' },
    update: {},
    create: { name: 'ملتقى تجريبي', slug: 'demo-quran-forum' },
  });

  await prisma.branch.upsert({
    where: { forumId_code: { forumId: forum.id, code: 'MAIN' } },
    update: {},
    create: { forumId: forum.id, name: 'الفرع الرئيسي', code: 'MAIN' },
  });

  for (const [name, displayName] of roles) {
    const role = await prisma.role.upsert({
      where: { forumId_name: { forumId: forum.id, name } },
      update: { displayName },
      create: { forumId: forum.id, name, displayName, isSystem: true },
    });

    for (const code of ROLE_PERMISSION_DEFAULTS[name]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: { description: PERMISSION_CATALOG[code] },
        create: { code, description: PERMISSION_CATALOG[code] },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

void main()
  .finally(async () => prisma.$disconnect());
