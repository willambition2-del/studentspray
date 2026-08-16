import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../widgets/demo_floating_bar.dart';

class DesignGalleryScreen extends StatefulWidget {
  const DesignGalleryScreen({super.key});

  @override
  State<DesignGalleryScreen> createState() => _DesignGalleryScreenState();
}

class _DesignGalleryScreenState extends State<DesignGalleryScreen> {
  String selectedDropdownValue = 'حلقة الإمام عاصم';
  bool isSwitchActive = true;
  double sliderValue = 82;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('معرض نظام التصميم والمكونات'),
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
      ),
      body: Stack(
        children: [
          Directionality(
            textDirection: TextDirection.rtl,
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 85),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Color Palette Section
                  _buildSectionTitle('1. لوحة الألوان المعتمدة (Color Palette)'),
                  _buildColorPaletteGrid(),

                  const SizedBox(height: 24),

                  // 2. Typography Section
                  _buildSectionTitle('2. الطباعة والخطوط العربية (Typography)'),
                  _buildTypographyCard(),

                  const SizedBox(height: 24),

                  // 3. Buttons & Interactive Controls
                  _buildSectionTitle('3. الأزرار وعناصر التفاعل (Buttons)'),
                  _buildButtonsCard(),

                  const SizedBox(height: 24),

                  // 4. Status Chips & Badges
                  _buildSectionTitle('4. شارات وحالات البيانات (Status Chips & Badges)'),
                  _buildStatusChipsCard(),

                  const SizedBox(height: 24),

                  // 5. Cards & Containers
                  _buildSectionTitle('5. نماذج البطاقات المعتمدة (Card Styles)'),
                  _buildCardsSection(),

                  const SizedBox(height: 24),

                  // 6. Form Controls & Inputs
                  _buildSectionTitle('6. حقول الإدخال والنماذج (Form Fields & Inputs)'),
                  _buildFormFieldsCard(),

                  const SizedBox(height: 24),

                  // 7. Progress & Indicators
                  _buildSectionTitle('7. مؤشرات التقدم والإنجاز (Progress & Indicators)'),
                  _buildProgressCard(),

                  const SizedBox(height: 24),

                  // 8. State Views (Loading / Empty / Error)
                  _buildSectionTitle('8. حالات الواجهة (State Views: Empty / Error / Loading)'),
                  _buildStateViewsCard(),
                ],
              ),
            ),
          ),
          const DemoFloatingReturnButton(),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: AppTheme.primaryDark,
        ),
      ),
    );
  }

  Widget _buildColorPaletteGrid() {
    final colors = [
      {'name': 'Primary Dark', 'color': AppTheme.primaryDark, 'hex': '#0F3A2A', 'textDark': false},
      {'name': 'Primary Brand', 'color': AppTheme.primary, 'hex': '#135D3F', 'textDark': false},
      {'name': 'Primary Light', 'color': AppTheme.primaryLight, 'hex': '#1E8A5E', 'textDark': false},
      {'name': 'Accent Gold', 'color': AppTheme.accentGold, 'hex': '#D4AF37', 'textDark': true},
      {'name': 'Gold Light', 'color': AppTheme.accentGoldLight, 'hex': '#F3E5AB', 'textDark': true},
      {'name': 'Present (حاضر)', 'color': AppTheme.statusPresent, 'hex': '#1E8A5E', 'textDark': false},
      {'name': 'Absent (غائب)', 'color': AppTheme.statusAbsent, 'hex': '#D32F2F', 'textDark': false},
      {'name': 'Late (متأخر)', 'color': AppTheme.statusLate, 'hex': '#E65100', 'textDark': false},
      {'name': 'Excused (معذور)', 'color': AppTheme.statusExcused, 'hex': '#1565C0', 'textDark': false},
    ];

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.15,
          ),
          itemCount: colors.length,
          itemBuilder: (context, index) {
            final item = colors[index];
            final color = item['color'] as Color;
            final isTextDark = item['textDark'] as bool;

            return Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(12),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item['name'] as String,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isTextDark ? AppTheme.textPrimary : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item['hex'] as String,
                    style: TextStyle(
                      fontSize: 9,
                      color: isTextDark ? AppTheme.textSecondary : Colors.white70,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTypographyCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Display — القرآن نور القلوب وهداية النفوس',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
            ),
            Divider(height: 20, color: AppTheme.dividerColor),
            Text(
              'Headline — حلقة الإمام عاصم بن أبي النجود للقرآن الكريم',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primary),
            ),
            Divider(height: 20, color: AppTheme.dividerColor),
            Text(
              'Title — خطة حفظ القرآن الكريم وتجويده للفصل الدراسي الأول',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            Divider(height: 20, color: AppTheme.dividerColor),
            Text(
              'Body Text — تم رصد درجات الاختبار الفتري الأول بنجاح، ويمكن لولي الأمر الاطلاع على تفاصيل التقييم والتوصيات عبر لوحة المتابعة.',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.5),
            ),
            Divider(height: 20, color: AppTheme.dividerColor),
            Text(
              'Caption / Muted Label — تاريخ التحديث الأخير: 1447/02/16 هـ • إشراف ملتقى الهدى القرآني',
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildButtonsCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: () {},
              child: const Text('زر أساسي (Primary Elevated Button)'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: Colors.white,
              ),
              child: const Text('زر ذهبي مميز (Accent Gold Button)'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () {},
              child: const Text('زر بإطار (Outlined Button)'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: null,
              child: const Text('زر معطل (Disabled Button)'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChipsCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildBadge('نشط', AppTheme.statusPresent),
            _buildBadge('مكتمل', AppTheme.primary),
            _buildBadge('قيد التنفيذ', AppTheme.accentGold),
            _buildBadge('متأخر', AppTheme.statusLate),
            _buildBadge('غائب', AppTheme.statusAbsent),
            _buildBadge('معذور', AppTheme.statusExcused),
            _buildBadge('ممتاز مرتفع', const Color(0xFF0D9488)),
            _buildBadge('يحتاج متابعة', const Color(0xFFE11D48)),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildCardsSection() {
    return Column(
      children: [
        // Summary Card
        Card(
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppTheme.dividerColor),
          ),
          child: const ListTile(
            leading: CircleAvatar(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              child: Icon(Icons.school_rounded),
            ),
            title: Text('بطاقة بيانات الحلقة (Halaqa Card)', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('حلقة الإمام نافع • 20 طالباً • الفترة المسائية'),
            trailing: Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.primary),
          ),
        ),
        const SizedBox(height: 10),
        // Award Card
        Card(
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppTheme.dividerColor),
          ),
          child: const ListTile(
            leading: Text('🏆', style: TextStyle(fontSize: 28)),
            title: Text('وسام التميز بالحفظ (Award Card)', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('تم منحه للطالب لإتقان حفظ سورة البقرة دون أي خطأ'),
          ),
        ),
      ],
    );
  }

  Widget _buildFormFieldsCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const TextField(
              decoration: InputDecoration(
                labelText: 'اسم الطالب / المعلم',
                prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'البحث في السجلات والحلقات...',
                prefixIcon: Icon(Icons.search_rounded, color: AppTheme.primary),
                suffixIcon: Icon(Icons.tune_rounded, color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedDropdownValue,
              decoration: const InputDecoration(
                labelText: 'اختر الحلقة',
                prefixIcon: Icon(Icons.groups_rounded, color: AppTheme.primary),
              ),
              items: const [
                DropdownMenuItem(value: 'حلقة الإمام عاصم', child: Text('حلقة الإمام عاصم')),
                DropdownMenuItem(value: 'حلقة الإمام نافع', child: Text('حلقة الإمام نافع')),
                DropdownMenuItem(value: 'حلقة الإمام الشاطبي', child: Text('حلقة الإمام الشاطبي')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => selectedDropdownValue = val);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('مؤشر إنجاز الخطة الأسبوعية', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('${sliderValue.toInt()}%', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: sliderValue / 100,
                backgroundColor: AppTheme.dividerColor,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                minHeight: 10,
              ),
            ),
            const SizedBox(height: 16),
            Slider(
              value: sliderValue,
              min: 0,
              max: 100,
              activeColor: AppTheme.primary,
              onChanged: (val) => setState(() => sliderValue = val),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStateViewsCard() {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Empty state snippet
            EmptyStateView(
              title: 'لا توجد نتائج مطابقة',
              subtitle: 'يمكنك تجربة تغيير كلمات البحث أو المرشحات',
              icon: Icons.search_off_rounded,
            ),
            Divider(height: 24, color: AppTheme.dividerColor),
            // Error view snippet
            ErrorView(
              message: 'تعذر تحميل بيانات الخادم (معاينة نموذج الخطأ)',
            ),
            Divider(height: 24, color: AppTheme.dividerColor),
            // Loading view snippet
            LoadingView(message: 'جاري تحميل سجلات التسميع والحضور...'),
          ],
        ),
      ),
    );
  }
}
