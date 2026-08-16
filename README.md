# Quran Forum Platform (منصة الملتقى القرآني)

منظومة تقنية وإدارية وتعليمية شاملة لإدارة ملتقيات وحلقات تحفيظ القرآن الكريم، تدمج بين لوحة تحكم إدارية مركزية للويب وتطبيق جوال متعدد الأدوار والخدمات التعليمية.

---

## 🏛️ بنية النظام التقنية (System Architecture)

```text
                               +-----------------------------+
                               |     React Admin (Web)       |
                               | General / Executive Manager |
                               +--------------+--------------+
                                              |
                                              | HTTPS / REST
                                              v
+-----------------------------+  HTTPS/WSS   +-----------------------------+
|    Flutter Mobile App       | <----------> |     NestJS API Backend      |
| Teacher / Supervisor /      |              |   Modular Domain Services   |
| Student / Parent            |              +--------------+--------------+
+-----------------------------+                             |
                                             +--------------+--------------+
                                             |                             |
                                             v                             v
                               +---------------------------+ +---------------------------+
                               |    PostgreSQL Database    | |        Redis Cache        |
                               |    Prisma ORM & Schema    | |   Sessions & Socket.IO    |
                               +---------------------------+ +---------------------------+
```

* **Backend**: NestJS 10 + TypeScript + Prisma ORM + Socket.IO + JWT + PDFKit + ExcelJS.
* **Database & Cache**: PostgreSQL 16 + Redis.
* **Web Portal**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
* **Mobile Application**: Flutter 3 + Dart + Riverpod + GoRouter + Drift (SQLite offline cache) + Dio.

---

## 👥 الأدوار والصلاحيات (Role Architecture)

### 1. بوابات الويب (Web Management Portals)
* **المدير العام (`GENERAL_MANAGER`)**: الإشراف العام، إعدادات المنظومة، الفروع، وإدارة الصلاحيات والقرارات المركزية.
* **المدير التنفيذي (`EXECUTIVE_MANAGER`)**: إدارة الشؤون التعليمية والتشغيلية، التسكين، الاعتمادات، وإصدار التقارير.

### 2. بوابات الجوال (Flutter Mobile Portals)
* **المعلم (`TEACHER`)**: إدارة الحلقات، تسجيل الحضور اليومي، رصد الحفظ والمراجعة، متابعة خطط الطلاب، والمحادثات.
* **المشرف الفني (`TECHNICAL_SUPERVISOR`)**: إدارة المعلمين والحلقات، تنفيذ الزيارات الميدانية، نماذج التقييم المعيارية، ومتابعة التوصيات.
* **الطالب (`STUDENT`)**: خطة الحفظ، سجل التسميع، نتائج الاختبارات، التقييمات، الأوسمة، والأنشطة والمسابقات.
* **ولي الأمر (`PARENT`)**: متابعة الأبناء مع مبدل تفاعلي، تقارير الحضور، نتائج التسميع والاختبارات، والتواصل مع المعلمين.

---

## 📁 هيكل المستودع (Repository Structure)

```text
├── backend/            # خادم NestJS وخدمات الـ API وقواعد البيانات (Prisma)
│   ├── prisma/         # Schema وملفات الترحيل (Migrations)
│   └── src/            # الوحدات البرمجية والخدمات
├── mobile/             # تطبيق فلاتر متعدد الأدوار (Flutter Mobile App)
│   └── lib/            # الميزات، واجهات المستخدم، ومزودات الحالة
├── src/                # واجهة الويب الإدارية (React Admin Dashboard)
├── docs/               # التوثيق الفني، خطط النشر، ومصفوفات الميزات
├── infra/              # قوالب البنية التحتية والـ Reverse Proxy (Nginx)
└── scripts/            # سكربتات النسخ الاحتياطي والاستعادة المؤتمتة
```

---

## 🚀 متطلبات التشغيل (Prerequisites)

* **Node.js**: `v20.x` أو أحدث
* **npm**: `v10.x` أو أحدث
* **Flutter SDK**: `v3.29.x` أو أحدث
* **PostgreSQL**: `v15` / `v16`
* **Redis**: `v7.x`

---

## ⚙️ التثبيت والإعداد (Setup & Installation)

### 1. إعداد الخادم الخلفي (Backend Setup)

```powershell
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

### 2. إعداد لوحة التحكم (Web Admin Setup)

```powershell
# من المجلد الرئيسي للمستودع
npm install
npm run dev
```

### 3. إعداد تطبيق الجوال (Flutter Mobile Setup)

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api/v1
```

---

## 🧪 أوامر الفحص والاختبار (Testing & Build Commands)

### Backend
```powershell
cd backend
npm run lint
npm run build
npm test
npx prisma validate
```

### Web Admin
```powershell
npx tsc --noEmit
npm run build
```

### Flutter Mobile
```powershell
cd mobile
dart analyze lib
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

---

## 📚 وثائق المشروع (Documentation)

* [دليل بيئة الإنتاج ومتغيرات البيئة](docs/production-environment.md)
* [دليل النشر والتشغيل السحابي](docs/deployment.md)
* [دليل النسخ الاحتياطي والاستعادة وقواعد البيانات](docs/backup-restore.md)
* [قائمة التدقيق الأمني وإصدار النسخ](docs/security-release-checklist.md)
* [مصفوفة تطابق ميزات تطبيق الجوال](docs/flutter-production-feature-parity.md)
