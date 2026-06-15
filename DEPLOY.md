# دليل النشر على GitHub Pages

دليل خطوة بخطوة لرفع منصة درب لمعايدات العيد على GitHub Pages مجاناً.

النتيجة: رابط دائم زي `https://USERNAME.github.io/darb-eid-platform/` يفتح من أي مكان وأي جهاز.

---

## ١. أنشئ حساب GitHub (لو ما عندك)

اذهب لـ [github.com/signup](https://github.com/signup) وسجّل حساب جديد. مجاني تماماً.

ملاحظة: تحتاج بريد إلكتروني للتفعيل.

---

## ٢. أنشئ Repository جديد

١. سجّل دخول في [github.com](https://github.com)
٢. اضغط زر `+` فوق يمين → **New repository**
٣. عبّي الحقول:
   - **Repository name:** `darb-eid-platform` (أو أي اسم تختاره)
   - **Description:** "منصة درب لإنشاء بطاقات المعايدة" (اختياري)
   - **Visibility:** Public (Pages يحتاج Public للحسابات المجانية)
   - **لا تحط** Initialize this repository (نحن نرفع الكود من جهازنا)
٤. اضغط **Create repository**
٥. GitHub بيوريك صفحة فيها أوامر — انسخ المسار اللي يبدأ بـ `https://github.com/...`

> 💡 **بديل:** لو سميته `USERNAME.github.io` (USERNAME = اسم حسابك)، الرابط النهائي راح يكون `https://USERNAME.github.io/` بدون `/darb-eid-platform/` في الآخر. أنظف وأقصر.

---

## ٣. ارفع الكود من جهازك

افتح **PowerShell** في مجلد المشروع وشغّل (غيّر `USERNAME` و `REPO_NAME`):

```powershell
cd "C:\Users\amal_hadi\.claude\New folder\darb-eid-platform"

# اربط مجلدك بالـ repo اللي أنشأته في GitHub
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# ارفع الكود
git push -u origin main
```

GitHub بيطلب منك تسجّل الدخول. اتبع التعليمات في النافذة (راح تفتح صفحة في المتصفح للموافقة).

> ⚠️ لو طلع لك خطأ "permission denied" تأكد إنك مسجّل في GitHub في نفس المتصفح اللي بيفتح.

---

## ٤. فعّل GitHub Pages في إعدادات الـ repo

١. ادخل صفحة الـ repo (مثلاً `github.com/USERNAME/darb-eid-platform`)
٢. اضغط على **Settings** فوق
٣. من القائمة الجانبية اليسرى، اضغط **Pages**
٤. تحت **Build and deployment** → **Source**: اختر **GitHub Actions** (مو "Deploy from a branch")
٥. خلاص — احفظ

---

## ٥. شاهد البناء يجري

١. ارجع لصفحة الـ repo الرئيسية
٢. اضغط على تبويب **Actions** فوق
٣. راح تشوف workflow اسمه **"Deploy to GitHub Pages"** يشتغل
٤. انتظر 2-4 دقائق (أول مرة فقط، المرات القادمة أسرع)
٥. لما يخلص ✅ اضغط على الـ run → بتشوف الرابط النهائي تحت `deploy`

---

## ٦. افتح موقعك!

الرابط النهائي:

- لو الـ repo اسمه `darb-eid-platform`: 
  **`https://USERNAME.github.io/darb-eid-platform/`**

- لو الـ repo اسمه `USERNAME.github.io`:
  **`https://USERNAME.github.io/`**

شارك الرابط مع زملائك في درب.

---

## ٧. تحديث الموقع في المستقبل

كل ما تعدّل شي في الكود، نفّذ:

```powershell
cd "C:\Users\amal_hadi\.claude\New folder\darb-eid-platform"
git add .
git commit -m "وصف التعديل"
git push
```

GitHub Actions بينشر النسخة الجديدة تلقائياً خلال دقايق. مافي خطوات إضافية.

---

## كلمة سر الإدارة في الموقع المنشور

افتراضياً: `darb2025`. لتغييرها:

1. في صفحة الـ repo → **Settings** → **Secrets and variables** → **Actions**
2. اضغط **New repository secret**
3. الاسم: `NEXT_PUBLIC_ADMIN_PASSWORD`
4. القيمة: كلمة السر اللي تبيها
5. اضغط **Save**
6. اعمل push جديد (أو شغّل الـ workflow يدوياً من تبويب Actions) عشان يعيد البناء

---

## ⚠️ تذكير مهم: البيانات per-browser

الإصدار الحالي يخزّن كل البيانات في `localStorage` المتصفح. يعني:
- ✅ كل موظف يقدر يفتح، يختار قالب، يكتب اسمه، يحمّل بطاقة
- ✅ كل موظف عنده **نسخته** من القوالب اللي ترفعها أنت
- ❌ تعديلاتك في `/admin` (مناسبة فعّالة، تعديل واجهة، رفع قوالب) **ما تظهر** لباقي الموظفين

للحصول على بيانات مشتركة بين كل المستخدمين، تحتاج تضيف backend (PostgreSQL على Vercel، Supabase، أو Firebase). أخبرني إذا تبي نحوّل المنصة لـ multi-user حقيقي.

---

## مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `git push` يطلب login ومايقبلني | استخدم [GitHub CLI](https://cli.github.com) أو [Personal Access Token](https://github.com/settings/tokens) بدل كلمة السر |
| الـ workflow يفشل في Actions | افتح الـ run، اقرأ الخطأ، أرسله لي |
| الصور ما تظهر بعد النشر | تأكد أن basePath متطابق مع اسم الـ repo (الـ workflow يضبطه تلقائياً) |
| 404 لما أزور رابط custom-XXX | متوقع — الصفحة بتنفتح من المعرض فقط (روابط custom مو محفوظة في الـ build) |
