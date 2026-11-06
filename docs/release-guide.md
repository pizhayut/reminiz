# Reminiz MVP0 — คู่มือเอาขึ้น Store

ลำดับ: **A. เว็บ (Vercel)** → **B. Build (EAS)** → **C. App Store** → **D. Google Play**
ทำ A ก่อนเพราะทั้ง 2 store ต้องใช้ลิงก์ Privacy / Support ที่เปิดได้จริง

> ⚠️ ก่อนเริ่ม แก้ 2 ค่าใน `site/*.html` ให้ถูก (ใส่ไว้ชั่วคราว): อีเมล `support@renzoft.com` และชื่อนิติบุคคล `บริษัท เรนซอฟต์ จำกัด` / `Renzoft Co., Ltd.` ให้ตรงกับชื่อในบัญชี Developer

---

## A. เว็บ Privacy / Terms / Support บน Vercel

ไฟล์อยู่ใน `site/` (HTML ล้วน ไม่ต้อง build) หน้าละสองภาษา `#th` / `#en`

1. vercel.com → **Add New… → Project** → Import Git Repository → เลือก `pizhayut/reminiz`
2. **Root Directory** = `site` · Framework Preset = **Other** · Build Command และ Output Directory ปล่อยว่าง → **Deploy**
3. Project → **Settings → Domains** → Add `reminiz.renzoft.com`
   - ถ้า `renzoft.com` ใช้ DNS ของ Vercel อยู่แล้ว จะต่อให้เอง
   - ถ้า DNS อยู่ที่อื่น: เพิ่ม record `CNAME  reminiz  →  cname.vercel-dns.com`
4. ตรวจว่าเปิดได้:
   - https://reminiz.renzoft.com/privacy
   - https://reminiz.renzoft.com/terms
   - https://reminiz.renzoft.com/support
5. (ทางเลือก) ตั้ง **Ignored Build Step** = `git diff --quiet HEAD^ HEAD -- .` เพื่อให้ deploy ใหม่เฉพาะตอน `site/` เปลี่ยน

---

## B. Build ด้วย EAS (ทำครั้งเดียวต่อเครื่อง)

```bash
cd apps/mobile
```
```bash
npx eas-cli@latest login
```
```bash
npx eas-cli@latest init
```
`init` จะสร้าง project บน expo.dev และเขียน `extra.eas.projectId` ลง `app.json` → commit ไฟล์นั้น

Build production ทั้ง 2 แพลตฟอร์ม (บน cloud ไม่ต้องใช้ Xcode/Android Studio):
```bash
npx eas-cli@latest build --platform all --profile production
```
- iOS: ครั้งแรก EAS จะถามให้ login Apple ID แล้วสร้าง Distribution Certificate + Provisioning Profile ให้เอง (ตอบ Yes)
- Android: ให้ EAS สร้าง upload keystore ให้ (ตอบ Yes) — keystore เก็บบน EAS ดาวน์โหลดสำรองได้ด้วย `eas credentials`
- เลข build (`buildNumber` / `versionCode`) EAS นับเพิ่มให้เอง (`autoIncrement`)

ทดสอบบนเครื่องจริงก่อนส่ง:
- Android: `npx eas-cli@latest build -p android --profile preview` → ได้ไฟล์ .apk ลงเครื่องได้ทันที
- iOS: ส่ง build ขึ้น TestFlight (ขั้น C3) แล้วติดตั้งจากแอป TestFlight

---

## C. App Store (iOS)

### C1. สร้างแอปใน App Store Connect
appstoreconnect.apple.com → Apps → **+ New App**
- Platform: iOS · Name: **Reminiz** · Primary Language: **Thai** (หรือ English) · Bundle ID: `com.renzoft.reminiz` (ถ้ายังไม่มีในรายการ ให้สร้างที่ developer.apple.com → Identifiers ก่อน หรือรัน `eas build` iOS หนึ่งรอบ EAS จะลงทะเบียนให้) · SKU: `reminiz-ios`

### C2. ข้อมูลหน้า Store (ใส่ทั้ง Thai และ English localization)

| ช่อง | ภาษาไทย | English |
|---|---|---|
| Name | Reminiz | Reminiz |
| Subtitle (≤30) | เกมภาพง่ายๆ ปลูกต้นไม้ทุกวัน | A simple picture game a day |
| Promotional text | เล่นวันละ 3 นาที แล้วดูต้นไม้ของคุณออกดอก | Play for 3 minutes a day and watch your tree bloom. |
| Keywords (≤100) | เกม,ผู้สูงอายุ,ภาพ,ต้นไม้,ง่าย,ตาไว,ครอบครัว,พ่อแม่,ปู่ย่า,ตายาย | game,seniors,elderly,pictures,tree,simple,easy,family,grandparents,relaxing |
| Support URL | https://reminiz.renzoft.com/support | same |
| Marketing URL | https://reminiz.renzoft.com | same |
| Privacy Policy URL | https://reminiz.renzoft.com/privacy | same |
| Copyright | 2026 Renzoft Co., Ltd. | same |

**Description (TH)**
```
Reminiz คือเกมภาพสั้นๆ สำหรับเล่นทุกวัน ออกแบบให้ผู้สูงอายุเล่นได้เองอย่างสบายใจ

• ตาไว: ภาพจะขึ้นแป๊บเดียว แล้วแตะเลือกภาพที่เห็น ใช้ภาพของคุ้นตา เช่น ผลไม้ สัตว์ ของในบ้าน
• ไม่มีคะแนน ไม่มีจับเวลาตอนเลือก ตอบผิดก็ไม่เป็นไร ภาพที่ไม่ใช่จะค่อยๆ จางหายไป
• ต้นไม้ไหวตามลมอยู่บนหน้าจอ ทุกสัปดาห์ที่เล่นครบ 3 วันจะมีดอกไม้บานเพิ่ม ไม่มีวันเหี่ยว
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
• Your tree sways in the breeze. Each week you play 3 days, a new flower blooms. Flowers never wilt.
• Large text, large buttons and a read-aloud button.
• Thai and English.
• No sign-up, no ads, no data collected. Everything stays on your phone.

Reminiz is a game for enjoyment. It is not a medical device.
```

> ห้ามใส่คำว่า อัลไซเมอร์ / สมองเสื่อม / dementia / ป้องกัน / ชะลอ / รักษา / ความจำดีขึ้น / clinically ในทุกช่อง รวมถึงในภาพ screenshot

### C3. ส่ง build
```bash
npx eas-cli@latest submit -p ios --latest
```
ครั้งแรกจะถาม App Store Connect API Key — ให้ EAS สร้างให้ (ต้องเป็น Admin ในทีม) build จะขึ้น TestFlight ใน ~10–30 นาที

### C4. หัวข้ออื่นใน App Store Connect
- **Category:** Primary = **Games**, Subcategories = **Puzzle**, **Family** · Secondary = Lifestyle
- **Age Rating:** ตอบ None ทุกข้อ → **4+** · "Made for Kids" = No
- **App Privacy:** Get Started → "Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app** → Publish
- **Pricing and Availability:** Free · ทุกประเทศ (หรือเริ่มที่ Thailand)
- **Encryption:** ตั้ง `ITSAppUsesNonExemptEncryption = false` ไว้ใน `app.json` แล้ว จะไม่ถามอีก
- **iPad:** `supportsTablet: false` จึงไม่ต้องส่ง screenshot iPad
- **Screenshots:** iPhone 6.9" (1320×2868 หรือ 1290×2796) อย่างน้อย 3 ภาพ — แนะนำ 4 ภาพ: หน้าหลักมีต้นไม้ออกดอก, ภาพโผล่กลางจอ, เลือกภาพ, หน้าจบรอบ (จับจาก simulator iPhone 17 Pro Max: `xcrun simctl io booted screenshot shot.png`)

### C5. App Review Information
- **Sign-in required:** ไม่ติ๊ก (ไม่มีบัญชี)
- **Contact:** ชื่อ / เบอร์ / อีเมลผู้ติดต่อจริง
- **Notes:**
```
Reminiz is a simple offline picture game designed for older adults.

No account or sign-in is needed. On first launch, choose what the app should call you (or tap "Just say hello"), then tap "Play today".

Game: a picture appears briefly in the middle of the screen, then the player taps the picture they saw (10 pictures per round, about 3 minutes). There are no scores, and choosing is never timed. A wrong choice simply fades out.

The animated tree on the home screen gains a flower for each week with 3 days of play.

The app collects no data, has no ads, no in-app purchases and needs no permissions. Everything is stored locally on the device. It works fully offline. It is a game for enjoyment and makes no medical claims.

The app follows the device language (Thai or English); the language can also be changed under "About this app" at the bottom of the home screen.
```
- **Submit for Review** → ปกติ 24–48 ชม.

---

## D. Google Play (Android)

### D1. สร้างแอป
play.google.com/console → **Create app** → App name: Reminiz · Default language: Thai · App or game: **Game** · Free · ยอมรับ declarations

### D2. ส่ง build แรก (อัปโหลดเองครั้งแรก)
Google ต้องให้อัปโหลด .aab ครั้งแรกผ่านเว็บ:
1. ดาวน์โหลด .aab จากหน้า build ใน expo.dev
2. Testing → **Internal testing** → Create new release → อัปโหลด .aab → ตั้ง release name `1.0.0 (1)` → Save → Review → Start rollout
3. ครั้งต่อไปใช้ `npx eas-cli@latest submit -p android --latest` ได้ (ต้องสร้าง Google Service Account JSON ตามคู่มือ EAS: https://docs.expo.dev/submit/android/)

### D3. App content (Policy → App content) — ตอบตามนี้
| หัวข้อ | คำตอบ |
|---|---|
| Privacy policy | https://reminiz.renzoft.com/privacy |
| App access | **All functionality is available without special access** |
| Ads | **No, my app does not contain ads** |
| Content rating | ทำแบบสอบถาม IARC: category = Game (Puzzle) → ตอบ No ทุกข้อ (ไม่มีความรุนแรง ไม่มีการพนัน ไม่มีการแชท/แชร์ตำแหน่ง ไม่มีการซื้อ) → ได้ Everyone / 3+ |
| Target audience | **18 and over** (หรือ 18+ ร่วมกับ 13–17 — แต่ไม่ติ๊กกลุ่มต่ำกว่า 13 เพื่อไม่เข้าโปรแกรม Families) |
| Data safety | Does your app collect or share any of the required user data types? → **No** · (ระบบจะถามเรื่อง encryption/deletion ต่อ — ตอบตามจริงว่าไม่เก็บข้อมูล) |
| Government apps | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | **ไม่ติ๊กอะไร / My app does not have any health features** (เป็นเกม ไม่ใช่แอปสุขภาพ) |
| News apps | No |

### D4. Store listing (Grow → Store presence → Main store listing)
- App name: Reminiz
- Short description (≤80): TH `เกมภาพง่ายๆ วันละ 3 นาที กับต้นไม้ที่ออกดอกไปพร้อมกับคุณ` · EN `A simple 3-minute picture game a day, and a tree that blooms with you.`
- Full description: ใช้ข้อความเดียวกับ App Store (C2)
- App icon 512×512: ย่อจาก `design/brand/app-icon.png`
- Feature graphic 1024×500: พื้น `#F6F4EF` + ต้นไม้ + wordmark สีเขียว
- Phone screenshots: อย่างน้อย 2 ภาพ (ใช้ชุดเดียวกับ iOS ได้)
- Category: **Game → Puzzle** · Tags: Casual, Offline
- Contact email: อีเมล support

### D5. ขึ้น Production
บัญชีนิติบุคคลไม่ต้องผ่าน closed testing 14 วัน → Production → **Create new release** → เลือก build เดียวกับ internal (Promote release) → Countries: Thailand (+ที่ต้องการ) → **Send for review** → ปกติ 1–3 วัน (แอปใหม่อาจถึง 7 วัน)

---

## E. Checklist สุดท้ายก่อนกด Submit
- [ ] 3 ลิงก์บน reminiz.renzoft.com เปิดได้ และอีเมล/ชื่อบริษัทถูกต้อง
- [ ] ติดตั้งจาก TestFlight / APK แล้วเล่นจบ 1 รอบบนเครื่องจริงทั้ง iPhone และ Android
- [ ] เปิดตัวหนังสือใหญ่สุดในเครื่อง (Dynamic Type / Font size) แล้วยังกดปุ่มได้ครบ
- [ ] โหมดเครื่องบิน (offline) ใช้งานได้ทั้งหมด
- [ ] ปุ่มลำโพงอ่านภาษาไทยได้บนเครื่องที่ติดตั้งเสียงไทย
- [ ] screenshot และข้อความ store ไม่มีคำต้องห้าม (C2)
- [ ] App Privacy = Data Not Collected / Data safety = No data collected

## F. อัปเดตครั้งต่อไป
- แก้แค่ JS/ข้อความ/ภาพ: `npx eas-cli@latest update` ได้ (ต้องติดตั้ง `expo-updates` ก่อน — ยังไม่ได้ใส่ใน MVP0 เพื่อให้แอปไม่มี network เลย)
- เปลี่ยน version: แก้ `version` ใน `app.json` (เช่น 1.0.1) แล้ว build + submit ใหม่

## G. รันบนเครื่องตัวเอง (dev)
- เร็วสุด: `cd apps/mobile && npx expo start --web` (เช็ก UI ในเบราว์เซอร์)
- iOS Simulator: `cd apps/mobile && npx expo run:ios` — ต้องมี CocoaPods ก่อน (ตอนนี้ในเครื่องยังไม่มี และ `brew install cocoapods` ล้ม) ติดตั้งด้วย `sudo gem install cocoapods` หรือแก้ Homebrew ก่อน · EAS cloud build ไม่ต้องใช้ CocoaPods ในเครื่อง
- Android Emulator: `cd apps/mobile && npx expo run:android`
