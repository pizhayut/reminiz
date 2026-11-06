# Reminiz MVP0 — คู่มือเอาขึ้น Store

ลำดับ: **A. เว็บ (Vercel)** → **B. Build (EAS)** → **C. ทดสอบเครื่องจริง** → **D. App Store** → **E. Google Play**
ต้องทำ A ก่อน เพราะทั้ง 2 store ต้องใช้ลิงก์ Privacy / Support ที่เปิดได้จริง

**ข้อมูลผู้พัฒนา**
| | |
|---|---|
| นิติบุคคล | บริษัท เรนซ์ ซอฟต์ จำกัด · Renz Soft Co., Ltd. |
| เว็บบริษัท | https://renzoft.com |
| อีเมลติดต่อ / support | admin@renzoft.com |
| เว็บแอป | https://reminiz.renzoft.com |
| Bundle ID / Package | `com.renzoft.reminiz` |
| ชื่อแอป | Reminiz |

---

## สิ่งที่ยังต้องทำ (checklist รวม)

**ฝั่งคุณ (ต้องใช้บัญชี / ตัดสินใจเอง)**
- [ ] A. Deploy `site/` บน Vercel + ต่อโดเมน `reminiz.renzoft.com`
- [ ] D1. สร้างแอปใน App Store Connect และจองชื่อ "Reminiz" (ถ้าชื่อถูกใช้แล้ว ต้องเลือกชื่อใหม่ เช่น "Reminiz – เกมภาพ")
- [ ] B. `eas login` + `eas init` แล้ว commit `app.json` ที่มี projectId
- [ ] B. Build production ทั้ง 2 แพลตฟอร์ม (ครั้งแรกต้อง login Apple ID ให้ EAS สร้าง certificate)
- [ ] C. ลงเครื่องจริง: iPhone ผ่าน TestFlight, Android ผ่าน APK และไล่ checklist ข้อ C
- [ ] D5. ใส่เบอร์โทรผู้ติดต่อจริงใน App Review Information
- [ ] E1. สร้างแอปใน Play Console แล้วอัปโหลด .aab ครั้งแรกเอง

**ฝั่งผม (สั่งได้เลย)**
- [ ] ทำ screenshot สำหรับ store (iPhone 6.9" และ Android) ครบ 4 ฉาก ได้แก่ เช้า, กลางวัน, กลางคืน และเกม
- [ ] แก้ CocoaPods ในเครื่องให้รัน iOS Simulator ได้ (ตอนนี้ `brew install cocoapods` ล้ม) ทำแค่ถ้าต้องการทดสอบบน simulator ก่อน TestFlight
- [ ] ปรับแก้ตามผลทดสอบเครื่องจริง เช่น ความลื่นบน Android รุ่นเก่า หรือเสียงอ่านภาษาไทย

**มีให้แล้ว**
- [x] โลโก้ / app icon / adaptive icon / splash
- [x] `design/store/play-icon-512.png` (ไอคอน Play 512×512)
- [x] `design/store/feature-graphic-1024x500.png` (feature graphic ของ Play)
- [x] หน้า privacy / terms / support (ไทย + อังกฤษ) ใน `site/`
- [x] ข้อความหน้า store ไทย/อังกฤษ และ Review Notes (ข้อ D2, D5)

---

## A. เว็บ Privacy / Terms / Support บน Vercel

ไฟล์อยู่ใน `site/` เป็น HTML ล้วน ไม่ต้อง build แต่ละหน้ามีทั้งไทย (`#th`) และอังกฤษ (`#en`)

1. vercel.com → **Add New… → Project** → Import `pizhayut/reminiz`
2. **Root Directory** = `site` · Framework Preset = **Other** · Build Command / Output Directory ปล่อยว่าง → **Deploy**
3. **Settings → Domains** → Add `reminiz.renzoft.com`
   - ถ้า DNS ของ `renzoft.com` อยู่บน Vercel อยู่แล้ว จะต่อให้อัตโนมัติ
   - ถ้า DNS อยู่ที่อื่น: เพิ่ม `CNAME  reminiz  →  cname.vercel-dns.com`
4. เปิดเช็กให้ครบ:
   - https://reminiz.renzoft.com/privacy
   - https://reminiz.renzoft.com/terms
   - https://reminiz.renzoft.com/support
5. (ทางเลือก) Settings → Git → **Ignored Build Step** = `git diff --quiet HEAD^ HEAD -- .` เพื่อให้ deploy ใหม่เฉพาะตอน `site/` เปลี่ยน

---

## B. Build ด้วย EAS

ทำในโฟลเดอร์ `apps/mobile`:
```bash
cd apps/mobile
```
```bash
npx eas-cli@latest login
```
```bash
npx eas-cli@latest init
```
`init` จะเขียน `extra.eas.projectId` ลง `app.json` → commit ไฟล์นั้น

Build production ทั้ง 2 แพลตฟอร์ม (build บน cloud ไม่ต้องมี Xcode หรือ CocoaPods ในเครื่อง):
```bash
npx eas-cli@latest build --platform all --profile production
```
- **iOS:** EAS ถาม Apple ID → ให้ EAS สร้าง Distribution Certificate + Provisioning Profile (ตอบ Yes) ต้องเป็นบัญชีที่อยู่ในทีม Renz Soft
- **Android:** ให้ EAS สร้าง upload keystore (ตอบ Yes) สำรอง keystore ได้ด้วย `npx eas-cli@latest credentials`
- เลข build (`buildNumber` / `versionCode`) EAS นับเพิ่มให้เอง

Build สำหรับทดสอบ:
- **Android APK:** ได้ไฟล์ .apk ลงเครื่องได้ทันที
  ```bash
  npx eas-cli@latest build -p android --profile preview
  ```
- **iOS:** ใช้ build production แล้วส่งขึ้น TestFlight (ข้อ D3)

---

## C. ทดสอบบนเครื่องจริงก่อนส่ง

ลองบน iPhone 1 เครื่อง, Android 1 เครื่อง และถ้ามี Android รุ่นเก่าอีก 1 เครื่อง:
- [ ] เปิดครั้งแรก → เลือกชื่อเรียก → หน้าหลัก → เล่นจบ 1 รอบ → ดอกไม้ประจำวันบาน (สีตรงกับวัน)
- [ ] ต้นไม้ไหวลื่น ไม่กระตุก บน Android รุ่นเก่า (ถ้ากระตุก บอกผมได้ ลดจำนวนกิ่ง หิ่งห้อย หรือเมฆลงได้)
- [ ] ฉากเปลี่ยนตามเวลาเครื่อง: เช้า 05:00–10:59, กลางวัน 11:00–17:59, กลางคืน 18:00–04:59 (ทดสอบได้โดยเปลี่ยนเวลาในเครื่อง)
- [ ] ปุ่มลำโพงอ่านภาษาไทยได้ (ถ้าเครื่องไม่มีเสียงไทย ปุ่มจะซ่อนเอง)
- [ ] เปิดตัวหนังสือใหญ่สุดในเครื่อง แล้วยังกดปุ่มได้ครบ
- [ ] โหมดเครื่องบิน (offline) ใช้งานได้ทั้งหมด
- [ ] สลับแอปกลางเกมแล้วกลับมา ไม่ค้าง
- [ ] หน้า "เกี่ยวกับแอป" เปิดลิงก์ privacy / terms / support ได้ (ต้องทำข้อ A ก่อน)

---

## D. App Store (iOS)

### D1. สร้างแอป
appstoreconnect.apple.com → Apps → **+ New App**
- Platform: **iOS**
- Name: **Reminiz**
- Primary Language: **Thai**
- Bundle ID: `com.renzoft.reminiz` (ถ้ายังไม่มีในรายการ ให้รัน `eas build` iOS หนึ่งรอบ EAS จะลงทะเบียนให้)
- SKU: `reminiz-ios`
- User Access: Full Access

### D2. ข้อมูลหน้า Store (ใส่ทั้ง localization ไทยและ English)

| ช่อง | ภาษาไทย | English |
|---|---|---|
| Name | Reminiz | Reminiz |
| Subtitle (≤30) | เกมภาพง่ายๆ กับต้นไม้ของคุณ | A simple picture game a day |
| Promotional text | เล่นวันละ 3 นาที รับดอกไม้ประจำวันบนต้นไม้ของคุณ | Play for 3 minutes a day and get your flower of the day. |
| Keywords (≤100) | เกม,ผู้สูงอายุ,ภาพ,ต้นไม้,ดอกไม้,ง่าย,ตาไว,ครอบครัว,ปู่ย่า,ตายาย | game,seniors,elderly,pictures,tree,flowers,simple,easy,family,relaxing |
| Support URL | https://reminiz.renzoft.com/support | same |
| Marketing URL | https://reminiz.renzoft.com | same |
| Privacy Policy URL | https://reminiz.renzoft.com/privacy | same |
| Copyright | 2026 Renz Soft Co., Ltd. | same |

**Description (TH)**
```
Reminiz คือเกมภาพสั้นๆ สำหรับเล่นทุกวัน ออกแบบให้ผู้สูงอายุเล่นได้เองอย่างสบายใจ

• ตาไว: ภาพจะขึ้นแป๊บเดียว แล้วแตะเลือกภาพที่เห็น ใช้ภาพของคุ้นตา เช่น ผลไม้ สัตว์ ของในบ้าน
• ไม่มีคะแนน ไม่จับเวลาตอนเลือก ตอบผิดก็ไม่เป็นไร ภาพที่ไม่ใช่จะค่อยๆ จางหายไป
• เล่นวันไหน ดอกไม้ประจำวันจะบานบนต้นไม้ของคุณ สัปดาห์ละไม่เกิน 7 ดอก
• ต้นไม้ไหวตามลม เช้ามีพระอาทิตย์ขึ้น กลางวันมีเมฆและนก กลางคืนมีหิ่งห้อย
• ตัวหนังสือใหญ่ ปุ่มใหญ่ มีปุ่มอ่านออกเสียง
• ภาษาไทยและภาษาอังกฤษ
• ไม่ต้องสมัคร ไม่มีโฆษณา ไม่เก็บข้อมูล ทุกอย่างอยู่ในเครื่องของคุณ

Reminiz เป็นเกมเพื่อความเพลิดเพลิน ไม่ใช่เครื่องมือทางการแพทย์
```

**Description (EN)**
```
Reminiz is a short picture game for every day, designed so older adults can play on their own with ease.

• Quick Eye: a picture shows for a moment, then tap the one you saw. Familiar pictures: fruit, animals, things at home.
• No scores and no timer when choosing. Wrong answers are fine: the other pictures gently fade away.
• Each day you play, your flower of the day blooms on your tree, up to 7 a week.
• Your tree sways in the breeze: a sunrise in the morning, clouds and birds by day, fireflies at night.
• Large text, large buttons and a read-aloud button.
• Thai and English.
• No sign-up, no ads, no data collected. Everything stays on your phone.

Reminiz is a game for enjoyment. It is not a medical device.
```

> ⚠️ **ห้ามใช้คำเหล่านี้ทุกช่องและในภาพ screenshot:** อัลไซเมอร์ / สมองเสื่อม / dementia / ป้องกัน / ชะลอ / รักษา / ความจำดีขึ้น / clinically

### D3. ส่ง build ขึ้น TestFlight
```bash
npx eas-cli@latest submit -p ios --latest
```
- ครั้งแรกจะถาม App Store Connect API Key → ให้ EAS สร้างให้ (บัญชีต้องเป็น Admin)
- build จะขึ้น TestFlight ภายใน 10–30 นาที
- เพิ่มตัวเองเป็น Internal Tester แล้วติดตั้งผ่านแอป TestFlight

### D4. หัวข้ออื่นใน App Store Connect
- **Category:** Primary = **Games**, Subcategories = **Puzzle** และ **Family** · Secondary = **Lifestyle**
- **Age Rating:** ตอบ None / No ทุกข้อ → ได้ **4+** · "Made for Kids" = **No**
- **App Privacy:** Get Started → "Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app** → Publish
- **Pricing and Availability:** Free · ทุกประเทศ (หรือเริ่มที่ Thailand)
- **Encryption:** ตั้งไว้ใน `app.json` แล้ว (`ITSAppUsesNonExemptEncryption = false`) จะไม่ถามอีก
- **iPad:** ตั้ง `supportsTablet: false` ไว้แล้ว จึงไม่ต้องส่ง screenshot iPad
- **Screenshots:** iPhone 6.9" (1320×2868 หรือ 1290×2796) อย่างน้อย 3 ภาพ แนะนำ 4 ภาพ (ผมทำให้ได้):
  1. หน้าหลักฉากเช้า
  2. หน้าหลักฉากกลางวัน
  3. หน้าหลักฉากกลางคืน
  4. ภาพในเกม ตอนเลือกภาพ

### D5. App Review Information
- **Sign-in required:** ไม่ติ๊ก
- **Contact:** ชื่อผู้ติดต่อ · เบอร์โทร · admin@renzoft.com
- **Notes:**
```
Reminiz is a simple offline picture game designed for older adults.

No account or sign-in is needed. On first launch, choose what the app should call you (or tap "Just say hello"), then tap "Play today".

Game: a picture appears briefly in the middle of the screen, then the player taps the picture they saw (10 pictures per round, about 3 minutes). There are no scores, and choosing is never timed. A wrong choice simply fades out.

Each day a round is completed, a flower blooms on the animated tree on the home screen (up to 7 per week; the week starts again on Monday). The home screen follows the device clock with a morning, daytime and night sky.

The app collects no data, has no ads, no in-app purchases and needs no permissions. Everything is stored locally on the device and it works fully offline. It is a game for enjoyment and makes no medical claims.

The app follows the device language (Thai or English). The language can also be changed under "About this app" at the bottom of the home screen.
```
- กด **Add for Review** → **Submit for Review** (ปกติรอ 24–48 ชม.)

---

## E. Google Play (Android)

### E1. สร้างแอปและอัปโหลด build แรก
1. play.google.com/console → **Create app**
   - App name: Reminiz
   - Default language: Thai
   - App or game: **Game**
   - Free or paid: **Free**
   - ติ๊กยอมรับ declarations ทั้งหมด
2. Google บังคับให้อัปโหลด build แรกผ่านเว็บ:
   - ดาวน์โหลด .aab จากหน้า build บน expo.dev
   - Testing → **Internal testing** → Create new release → อัปโหลด .aab → Release name `1.0.0 (1)` → Save → Review → Start rollout
3. ครั้งต่อไปส่งด้วยคำสั่งนี้ได้ (ต้องสร้าง Google Service Account JSON ก่อนตามคู่มือ https://docs.expo.dev/submit/android/):
   ```bash
   npx eas-cli@latest submit -p android --latest
   ```

### E2. App content (Policy → App content)
| หัวข้อ | คำตอบ |
|---|---|
| Privacy policy | https://reminiz.renzoft.com/privacy |
| App access | **All functionality is available without special access** |
| Ads | **No, my app does not contain ads** |
| Content rating | แบบสอบถาม IARC: category = Game → ตอบ No ทุกข้อ → ได้ Everyone / 3+ · อีเมล admin@renzoft.com |
| Target audience | **18 and over** (ห้ามเลือกช่วงอายุต่ำกว่า 13 เพื่อไม่เข้าโปรแกรม Families) |
| Data safety | Collect or share any user data? → **No** |
| Government apps | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | **My app does not have any health features** |
| News apps | No |

### E3. Store listing (Grow → Store presence → Main store listing)
- **App name:** Reminiz
- **Short description (≤80):**
  - TH: `เกมภาพง่ายๆ วันละ 3 นาที รับดอกไม้ประจำวันบนต้นไม้ของคุณ`
  - EN: `A simple 3-minute picture game a day, with a flower on your tree.`
- **Full description:** ใช้ข้อความเดียวกับ App Store (D2)
- **App icon:** `design/store/play-icon-512.png`
- **Feature graphic:** `design/store/feature-graphic-1024x500.png`
- **Phone screenshots:** อย่างน้อย 2 ภาพ (ใช้ชุดเดียวกับ iOS)
- **Category:** Game → **Puzzle** · Tags: Casual, Offline
- **Contact details:** admin@renzoft.com · เว็บไซต์ https://renzoft.com

### E4. ขึ้น Production
บัญชีนิติบุคคลไม่ต้องผ่าน closed testing 14 วัน:
1. Production → **Create new release** → Promote build เดียวกับ internal
2. Countries: Thailand (และประเทศอื่นที่ต้องการ)
3. **Send for review** (ปกติ 1–3 วัน แอปใหม่อาจถึง 7 วัน)

---

## F. อัปเดตครั้งต่อไป
1. แก้ `version` ใน `apps/mobile/app.json` (เช่น `1.0.1`)
2. Build และ submit ใหม่ (ข้อ B, D3, E1)

MVP0 ยังไม่ได้ใส่ `expo-updates` (OTA) เพื่อให้แอปไม่มีการเชื่อมต่อ network เลย

## G. รันบนเครื่องตัวเอง (dev)
- **เร็วสุด (เบราว์เซอร์):**
  ```bash
  cd apps/mobile && npx expo start --web
  ```
  ทดสอบแต่ละฉากด้วย `/?scene=morning`, `/?scene=day`, `/?scene=night` (ใช้ได้เฉพาะ dev ใน build จริงจะไม่มีผล)
- **iOS Simulator:**
  ```bash
  cd apps/mobile && npx expo run:ios
  ```
  ต้องมี CocoaPods ก่อน ตอนนี้ในเครื่องยังไม่มี
- **Android Emulator:**
  ```bash
  cd apps/mobile && npx expo run:android
  ```
