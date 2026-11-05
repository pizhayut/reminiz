# Reminiz MVP0 — แผนเร่งด่วนเพื่อส่ง App Review

**เป้าหมาย:** ส่ง iOS (และ Android) เข้า review ภายใน **7 วันทำงาน** (ส่งได้ ~13–14 พ.ย. 2026) แล้วต่อยอดเป็น MVP1 (20 พ.ย.) บนฐานโค้ดเดียวกัน โดยไม่ต้องรื้อ

**หลักคิด:** MVP0 = "แอปครอบครัว + เกมสมอง 1 เกม" เท่านั้น ไม่มี check-in, ไม่มี Change Engine, ไม่มีการแปลผลสุขภาพ → ลดความเสี่ยงโดน reject เรื่อง medical claim (Guideline 1.4.1) และลดงานลงมาก

---

## 1. ขอบเขต MVP0

### ผู้ดูแล (caregiver) — ทำได้ทุกอย่างในครอบครัว
- เข้าสู่ระบบด้วย email OTP
- สร้างต้นไม้ (1 ต้น = ผู้สูงอายุ 1 คน): ชื่อที่ครอบครัวเรียก (คุณแม่/คุณพ่อ/คุณยาย/อื่นๆ), อายุ, ภาษา — **ยังไม่เก็บ** สิทธิการรักษา/โรค/ยา (ไปทำใน MVP1)
- จับคู่เครื่องผู้สูงอายุด้วย QR / รหัส 6 หลัก
- เชิญครอบครัวด้วยลิงก์, ดูรายชื่อสมาชิก, ลบสมาชิก, เปลี่ยนสิทธิ์
- เขียนจดหมาย, ดูคำตอบแบบฟอร์มของทุกคน, ดูว่าแม่เล่นเกมกี่วัน
- แก้ข้อมูลต้นไม้, ยกเลิกการจับคู่เครื่อง, ลบต้นไม้, **ลบบัญชี** (Apple บังคับ)

### ครอบครัว (family)
- เข้าร่วมต้นไม้จากลิงก์เชิญ (email OTP)
- เขียนจดหมาย: ข้อความ + รูป 1 รูป (ยังไม่มีเสียง)
- ตอบแบบฟอร์มรายเดือน "เทียบกับไม่กี่เดือนก่อน…" 5 ข้อ (Same / A bit more / Much more / Not sure) ตาม `06-FamilyInformant` พร้อมกล่องฉุกเฉิน "โทร 1669" — ติดป้าย "ยังไม่ผ่านการตรวจสอบ", **ไม่แสดงผลแปลความ** แค่เก็บและให้ผู้ดูแลเห็นประวัติ

### ผู้สูงอายุ (player mode) — ไม่มีรหัสผ่าน ไม่มีตั้งค่า
- หน้าหลัก (ตาม `01-Main` แต่ไม่มีการ์ด check-in): "สวัสดีตอนเช้า คุณแม่" + ปุ่มใหญ่ **"เล่นวันนี้"** + ต้นไม้ + การ์ดจดหมายใหม่
- กล่องจดหมาย (`13-Mailbox`): อ่านจดหมาย, ปุ่ม **"อ่านออกเสียง"** (expo-speech, TTS ในเครื่อง), จดหมายเก่าเก็บไว้ทั้งหมด, บันทึก `opened_at` ให้ครอบครัวรู้ว่าแม่เปิดอ่านแล้ว
- เล่นเกม 1 เกม (ดูข้อ 2)
- ต้นไม้โตตามจำนวนวันที่เล่น (คำนวณจาก sessions, ไม่เคยเหี่ยว/รีเซ็ต) — 1 ดอกต่อสัปดาห์ที่เล่นครบ 3 วัน

### ไม่ทำใน MVP0
Monthly check-in, Change Engine, รายงาน/Brain profile, PDF หมอ, portal หมอ, validation dashboard, Quick Eye, จดหมายเสียง/ตอบกลับด้วยเสียง, ภาษาอาหรับ, push notification (ทำถ้าเหลือเวลา), สิทธิการรักษา/โรค/ยา

---

## 2. เกมที่เสนอ: **Memory Album (อัลบั้มความทรงจำ)**

> "นี่คือใคร?" — แสดงรูปครอบครัว 1 รูป ให้เลือกชื่อจาก 3 ตัวเลือกใหญ่ๆ

**ทำไมเลือกเกมนี้ (ไม่ใช่ Quick Eye):**
| | Memory Album | Quick Eye |
|---|---|---|
| ความยากในการสร้าง | ต่ำ — UI ธรรมดา ไม่ต้องจับเวลาระดับ frame | สูง — reanimated/skia, staircase, frame timing, ทดสอบหลายรุ่นเครื่อง |
| ผูกกับครอบครัว | ใช้รูปที่ครอบครัวอัปโหลด → ครอบครัวมีเหตุผลให้กลับมา | ไม่เกี่ยว |
| ความรู้สึกผู้สูงอายุ | อบอุ่น, ไม่มีความกดดัน | อาจเครียด (ต้องเร็ว) |
| ความเสี่ยง review | ต่ำ | ต่ำ |
| อยู่ใน MVP1 อยู่แล้ว | ✅ | ✅ (ทำต่อทีหลัง) |

**กติกา (errorless learning ตามแผนหลัก):**
- 1 รอบ = 5 รูป (~2 นาที). ตัวเลือก 3 ชื่อ ปุ่มสูง ≥ 72pt
- ตอบผิด → ตัวเลือกนั้น **ค่อยๆ จางหาย** (ไม่มีเสียงผิด ไม่มีกากบาท) ให้เลือกใหม่จนถูก
- ตอบถูก → รูปขยาย + ข้อความที่ครอบครัวเขียนไว้ เช่น "แอนตอนรับปริญญา 2019" + อ่านออกเสียง
- **ไม่มีคะแนน ไม่มีเวลาจำกัด** จบรอบ = "วันนี้เล่นแล้ว 🌱 ต้นไม้ของคุณแม่โตขึ้น"
- เก็บ `game_sessions` (จำนวนครั้งที่ลอง, เวลา) ไว้ฝั่งครอบครัว/ใช้ต่อ MVP1 แต่ไม่แสดงให้ผู้สูงอายุเห็น

**ข้อมูลเกม:** ครอบครัวอัปโหลดรูป + ตอบ "นี่คือใคร" + คำบรรยายสั้น (ในหน้า "เพิ่มรูปให้คุณแม่")
**Fallback เมื่อรูปครอบครัว < 5 รูป:** ใช้ชุดภาพในแอป (ผลไม้/สัตว์/ของใช้ไทย "นี่คืออะไร?") → เครื่องใหม่หรือ reviewer เล่นได้ทันที

---

## 3. Design system (สวย + ใช้ง่ายสำหรับผู้สูงอายุ)

อิงจาก `design/source/*.dc.html`

| Token | ค่า | ใช้ทำ |
|---|---|---|
| `bg` | `#F6F4EF` | พื้นหลังโทนกระดาษอุ่น |
| `surface` | `#FFFFFF` | การ์ด |
| `primary` | `#1D6B63` / pressed `#134C46` | ปุ่มหลัก, ต้นไม้ |
| `primarySoft` | `#E3EFEC` | chip ที่เลือก, ใบไม้ |
| `accent` | `#E07A3F` | ดอกไม้, badge จดหมายใหม่ |
| `warmSoft` | `#FBEBDD` / border `#E8C3A0` | กล่องฉุกเฉิน, postcard |
| `text` / `textMuted` | `#1E2422` / `#4F5753` | contrast ≥ AA |
| `border` | `#D9D5CC` | ขอบการ์ด |
| `trunk` | `#8A6A4E` | ลำต้น |

- **ฟอนต์:** Atkinson Hyperlegible (EN) + **IBM Plex Sans Thai Looped** หรือ Noto Sans Thai Looped (TH — แบบมีหัว อ่านง่ายกว่าสำหรับผู้สูงอายุ; Atkinson ไม่มีอักษรไทย)
- **ขนาด:** ผู้สูงอายุ body 22pt, หัวข้อ 32pt; ครอบครัว body 17pt. รองรับ Dynamic Type (ไม่ล็อก `allowFontScaling`)
- **ปุ่ม:** สูง ≥ 64pt (player) / ≥ 52pt (family), มุมโค้ง 20, 1 หน้าจอมีปุ่มหลักปุ่มเดียว
- **Player mode:** ไม่มี tab bar, ไม่มี gesture ซ่อน, ปุ่มกลับเป็นวงกลมใหญ่มุมซ้ายบน, ปุ่มลำโพงอ่านทุกหน้า, ไม่มี modal ซ้อน, ไม่มีอะไรหายเองตามเวลา
- **Motion:** นุ่ม ช้า (250–400ms), ต้นไม้โตแบบ spring เล็กน้อย; เคารพ Reduce Motion
- **Haptics** เบาๆ เมื่อตอบถูก
- ภาษา: EN (source) + TH ใน release แรก, i18next, ไม่มี hardcoded string

---

## 4. Stack (ชุดเดียวกับ MVP1 เพื่อไม่ต้องรื้อ)

- `apps/mobile` — Expo SDK ล่าสุด + Expo Router + TypeScript; groups `(auth)`, `(family)`, `(player)`
- `packages/shared` — types (generated จาก Supabase), i18n strings, design tokens, content pack fallback
- `supabase/` — migrations, RLS, seed, edge function `pair-device`, `delete-account`
- ยังไม่มี `apps/portal` (เพิ่มตอน MVP1)
- Libraries: `expo-camera` (สแกน QR), `react-native-qrcode-svg`, `expo-image-picker` + `expo-image-manipulator` (ย่อรูปก่อนอัปโหลด), `expo-speech`, `expo-haptics`, `react-native-reanimated`, `react-native-svg` (ต้นไม้), `@tanstack/react-query`, `expo-secure-store` (เก็บ session ผู้สูงอายุ)

### Data model MVP0 (subset ของ MVP1 — ตั้งชื่อตาม CLAUDE.md)
- `profiles`, `trees` (display_name, call_name, age, locale, timezone, country), `tree_members` (role: player | caregiver | family; unique player)
- `pairing_codes` (6 หลัก, ใช้ครั้งเดียว, หมดอายุ 10 นาที), `invites` (token, tree_id, role, expires_at)
- `letters` (tree_id, author_id, body, photo_path, opened_at)
- `photos` (tree_id, uploader_id, path, answer_name, caption)
- `game_sessions` (tree_id, mode='memory_album', started_at, duration_ms, attempts jsonb, client_id unique)
- `assessments` (type='family_informant', version, form_id, responses jsonb, respondent_id)
- RLS ทุกตารางผ่าน `is_member(tree_id)` + `is_caregiver(tree_id)` สำหรับงานจัดการ; Storage bucket `tree-photos` แบบ private, โฟลเดอร์ต่อ tree_id, เปิดด้วย signed URL

### Player auth (ไม่มีรหัสผ่าน)
เครื่องผู้สูงอายุ → `signInAnonymously()` → แสดง QR/รหัส 6 หลัก → ผู้ดูแลสแกน → edge function `pair-device` เพิ่ม anon user เป็น `role=player` → เครื่องเข้า player mode ค้างไว้ตลอด (session refresh อัตโนมัติ). ปลดล็อกออกจาก player mode = กดค้างที่โลโก้ 3 วินาที + ผู้ดูแลยกเลิกการจับคู่จากเครื่องตัวเอง

---

## 5. แผนรายวัน (7 วันทำงาน)

| วัน | งาน | เสร็จเมื่อ |
|---|---|---|
| **D1** (6–7 พ.ย.) | Monorepo, Expo app + Router groups, design tokens + ฟอนต์ + ชุด component พื้นฐาน (Button, Card, Screen, BigBackButton, SpeakButton), Supabase project, migrations + RLS + seed | แอปเปิดได้, หน้า component ตัวอย่างสวยตาม mockup |
| **D2** | Email OTP, สร้างต้นไม้, เชิญครอบครัว (ลิงก์ + deep link `reminiz://join/<token>` / universal link), จัดการสมาชิก | ผู้ดูแลสร้างต้นไม้ + เชิญอีกบัญชีเข้าได้ |
| **D3** | Player mode: pairing QR + รหัส, หน้าหลักผู้สูงอายุ, ต้นไม้ SVG โตตามวัน | เครื่อง 2 จับคู่แล้วเข้า player mode |
| **D4** | เขียนจดหมาย + รูป, กล่องจดหมายผู้สูงอายุ + อ่านออกเสียง + opened_at, แบบฟอร์มครอบครัว + กล่อง 1669 | วงจรจดหมายครบทั้ง 2 ฝั่ง |
| **D5** | Memory Album: อัปโหลดรูป+ชื่อ, เกม errorless, fallback content pack, บันทึก session, ต้นไม้โต | ผู้สูงอายุเล่นจบรอบ ต้นไม้ขึ้นวัน |
| **D6** | แปลไทยครบ, QA ผู้สูงอายุจริง 1–2 คน (ปู่ย่าในบ้าน), Dynamic Type/VoiceOver, empty states, error states, ลบบัญชี, privacy policy + terms (หน้าเว็บ), App icon + splash | ผ่าน checklist ข้อ 6 |
| **D7** | EAS Build production, TestFlight, screenshot 6.9"/6.5" + Play feature graphic, App Store Connect metadata, Privacy Nutrition Label, demo account, **Submit** | สถานะ "Waiting for Review" |

ถ้าต้องตัดเพิ่ม: ตัด Android ไว้ส่งทีหลัง 1–2 วัน, ตัดการจัดการสิทธิ์สมาชิก (เหลือแค่ลบ), ตัดรูปในจดหมาย (เหลือรูปในเกม)

---

## 6. Checklist App Review (จุดที่มักโดน reject)

- [ ] **Demo account สำหรับ reviewer**: email OTP ทำให้ reviewer login ไม่ได้ → เพิ่ม allow-list email `review@…` ที่ใช้ OTP คงที่ (Supabase test OTP / edge function) + seed ต้นไม้ที่มีจดหมายและรูปพร้อม; เขียนวิธีเข้า player mode ใน Review Notes (ทำได้ด้วยเครื่องเดียว: ปุ่ม "ลองโหมดผู้สูงอายุ" ในบัญชี demo)
- [ ] **ลบบัญชีในแอป** (5.1.1(v))
- [ ] **ไม่มี medical claim** ในแอปและ metadata: ห้ามคำว่า ป้องกัน/ชะลอ/ตรวจ อัลไซเมอร์ หรือ diagnose; วางตัวเป็น "แอปครอบครัว + เกมฝึกสมองเพื่อความเพลิดเพลิน"; แบบฟอร์มครอบครัวไม่แปลผล (1.4.1)
- [ ] **UGC (1.2)**: เนื้อหาเป็นส่วนตัวในครอบครัว แต่ใส่ปุ่ม "รายงาน/ลบจดหมาย" และ "ลบสมาชิก" ไว้ ป้องกันโดนถาม
- [ ] Privacy policy URL + Privacy Nutrition Label (email, photos, user content, ข้อมูลสุขภาพจากแบบฟอร์ม = Health & Fitness, linked to user, ไม่ tracking)
- [ ] Permission strings ภาษาไทย/อังกฤษชัดเจน: Camera (สแกน QR), Photo Library (เลือกรูปให้คุณแม่)
- [ ] Consent ก่อนตอบแบบฟอร์มสุขภาพ (PDPA ข้อมูลอ่อนไหว) — ใช้ `08-HealthConsent` แบบย่อ
- [ ] ไม่มีปุ่ม/หน้าที่ยังไม่เสร็จ, ไม่มีคำว่า "beta"/"coming soon"
- [ ] Age rating 4+, หมวด Lifestyle (ไม่ใช่ Medical — ลดการตรวจเข้ม)
- [ ] Android: Data safety form, target SDK ล่าสุด, closed testing ตามเงื่อนไขบัญชี developer ใหม่ของ Google Play (ถ้าบัญชีใหม่ต้องมี tester ช่วงหนึ่งก่อน production — เริ่มให้เร็ว)

---

## 7. ทางต่อ MVP1 (ไม่ต้องรื้อ)
ตารางและ role เป็น subset ของ data model MVP1 อยู่แล้ว → เพิ่ม: About Mum เต็ม (coverage/โรค/ยา), check-in 3 tasks + offline sqlite, Change Engine ใน `packages/shared`, report, PDF, Quick Eye, portal หมอ, validation dashboard, อาหรับ RTL

## สิ่งที่ต้องตัดสินใจ / เตรียมจากฝั่งเรา
1. Apple Developer + Google Play account (ชื่อบริษัทหรือส่วนบุคคล) — ถ้ายังไม่มี ทำวันนี้ (Apple organization ต้องใช้ D-U-N-S อาจใช้หลายวัน)
2. Bundle ID เช่น `app.reminiz` / โดเมนสำหรับ privacy policy + universal link
3. Supabase region (Singapore ใกล้ไทยสุด)
4. ยืนยันเกม Memory Album
