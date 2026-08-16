# Quran Forum — Multi-Role Flutter Mobile Application

تطبيق الجوال الموحد لمنصة الملتقى القرآني، مبني باستخدام Flutter وRiverpod ومجهز لدعم كافة الأدوار: المعلم (`TEACHER`)، المشرف الفني (`TECHNICAL_SUPERVISOR`)، الطالب (`STUDENT`)، وولي الأمر (`PARENT`)، مع دعم كامل للعمل دون اتصال ومزامنة البيانات اللحظية وإشعارات FCM.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Framework**: Flutter 3.44+ (Dart 3.12+)
- **State Management**: `flutter_riverpod` (^2.6.1)
- **Routing**: `go_router` (^14.6.2)
- **Networking**: `dio` (^5.7.0) مع `AuthInterceptor` و Single-Flight Token Refresh
- **Secure Token Storage**: `flutter_secure_storage` (^9.2.2) — لتخزين Refresh Token مشفرًا
- **Local Persistence & Offline Queue**: `drift` (^2.24.1) + `sqlite3_flutter_libs`
- **Network Connectivity**: `connectivity_plus` (^6.1.1)
- **Localization**: Arabic RTL Native Layout (`flutter_localizations`, `intl`)

---

## 📱 معمارية التطبيق (Architecture)

```text
mobile/lib/
├── app/
│   ├── app.dart                   # MaterialApp, Theme & RTL Localization
│   └── router.dart                # GoRouter with Auth & Multi-Role Redirect
├── core/
│   ├── config/env.dart            # API_BASE_URL & Forum slug config
│   ├── database/app_database.dart # Drift SQLite DB (PendingMutations, CachedHalaqas)
│   ├── errors/app_exception.dart  # Centralized error mapping
│   ├── network/
│   │   ├── api_client.dart        # Central Dio wrapper
│   │   └── auth_interceptor.dart  # 401 refresh queue & header injector
│   ├── storage/token_storage.dart # Secure storage (Refresh token only)
│   ├── sync/sync_service.dart     # Offline queue replay & Idempotency UUIDs
│   ├── theme/app_theme.dart       # Quranic emerald & gold design system
│   ├── utils/quran_data.dart      # Static catalog for 114 Surahs & Ayah counts
│   └── widgets/state_views.dart   # Loading, Error, and Empty state widgets
└── features/
    ├── auth/
    │   ├── models/                # UserProfile, ForumRef, BranchRef
    │   ├── providers/             # AuthNotifier, Riverpod providers
    │   └── screens/               # SplashScreen, LoginScreen
    ├── teacher/
    │   ├── models/                # HalaqaItem, WorkspaceStudent, StudentProgressData
    │   ├── providers/             # TeacherProviders, Operations Notifier
    │   └── screens/
    │       ├── teacher_home_screen.dart     # Teacher Dashboard & assigned halaqas
    │       ├── halaqas_list_screen.dart     # Full list of halaqas
    │       ├── halaqa_detail_screen.dart    # Halaqa workspace & students
    │       ├── attendance_screen.dart       # Fast bulk attendance marking
    │       ├── memorization_screen.dart     # New recitation recording
    │       ├── revision_screen.dart         # Revision recording (Surah/Juz)
    │       └── student_progress_screen.dart # Progress indicators & history
    └── placeholders/
        └── unsupported_role_screen.dart     # Polite placeholder for Supervisor/Student/Parent
```

---

## 🔒 إدارة الجلسات والأمان (Security & Offline Invariants)

1. **تخزين الرموز (Token Storage)**:
   - يتم تخزين `AccessToken` في الذاكرة فقط (`In-Memory`).
   - يتم حفظ `RefreshToken` حصريًا داخل `FlutterSecureStorage` (EncryptedSharedPreferences على أندرويد).
   - لا يتم تخزين أي كلمات مرور أو رموز وصول في قاعدة بيانات Drift أو SharedPreferences العادية.

2. **معالجة 401 وإعادة التدوير (Single-Flight Refresh Lock)**:
   - عند حدوث `401 Unauthorized`، يقوم `AuthInterceptor` بحجز الطلبات في قائمة انتظار وإجراء عملية تجديد واحدة `POST /auth/mobile/refresh`.
   - يتم حفظ الرمز الجديد وإعادة تنفيذ الطلبات الفاشلة تلقائيًا.

3. **العمل بدون اتصال وقائمة الانتظار (Offline Queue & Idempotency)**:
   - عند انقطاع الإنترنت، يتم حفظ العمليات (`ATTENDANCE`, `MEMORIZATION`, `REVISION`) محليًا داخل جدول `PendingMutations` في Drift.
   - يتم توليد `clientMutationId` فريد بصيغة UUID لكل عملية ويتم الحفاظ عليه أثناء إعادة المحاولة لضمان مطابقة الـ Idempotency في السيرفر وعدم التكرار.
   - عند عودة الاتصال، يقوم `SyncService` بمزامنة كافة العمليات المعلقة وحذفها فور تأكيد السيرفر.
   - يتم عزل العمليات المعلقة لكل مستخدم عبر `userId`، مما يمنع تسريب البيانات بين الحسابات عند تسجيل الخروج.

---

## 🧪 الاختبارات والتحقق (Tests & Verification)

- **تشغيل التحليل الثابت**:
  ```powershell
  cd mobile
  dart analyze
  ```
  *(النتيجة: 0 issues)*

- **تشغيل اختبارات الوحدة والواجهات**:
  ```powershell
  cd mobile
  flutter test
  ```
  *(النتيجة: All 41 unit and widget tests PASS)*

- **بناء حزمة أندرويد (Debug APK)**:
  ```powershell
  cd mobile
  flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
  ```
  *(النتيجة: Built `build/app/outputs/flutter-apk/app-debug.apk` successfully)*
