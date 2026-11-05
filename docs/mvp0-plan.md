# Reminiz MVP0 — เปิดแอป เห็นต้นไม้ เล่น 1 เกม จบ

**เป้าหมาย:** ส่ง App Store + Google Play ภายใน **3 วันทำงาน** (ส่งได้ราว 10–11 พ.ย. 2026) ด้วยความเสี่ยงโดน reject ใกล้ศูนย์ แล้วต่อยอดเป็น MVP1 บนฐานโค้ดเดียวกัน

**หลักคิด:** ไม่มี backend ไม่มี login ไม่มีอัปโหลด ไม่มี network ไม่มีการเก็บข้อมูล → ไม่มี account deletion, ไม่มี UGC, ไม่มี PDPA, Privacy Label = "Data Not Collected", ไม่มี medical claim

---

## 1. สิ่งที่ผู้ใช้เห็น (ทั้งแอปมี 4 หน้าจอ)

1. **ครั้งแรกที่เปิด (ครั้งเดียว):** "อยากให้เราเรียกคุณว่าอะไร?" chip ใหญ่ คุณแม่ / คุณพ่อ / คุณยาย / คุณตา / ข้าม — เก็บในเครื่องเท่านั้น. ภาษาเลือกตามเครื่อง (TH/EN)
2. **หน้าหลัก** (ตาม `01-Main` แต่ตัด check-in และจดหมาย): "สวัสดีตอนเช้า คุณแม่" + ปุ่มลำโพง → **ต้นไม้** ตรงกลาง → ปุ่มใหญ่ปุ่มเดียว **"เล่นวันนี้"** (เล่นแล้ววันนี้ → "วันนี้เล่นแล้ว เล่นอีกรอบได้นะ")
3. **เกม** (ข้อ 2)
4. **จบรอบ:** "เก่งมาก ต้นไม้ของคุณโตขึ้นแล้ว" + อนิเมชันใบไม้/ดอกไม้ใหม่ → กลับหน้าหลัก

**ต้นไม้:** โตตามจำนวน "วันที่เล่น" สะสม (เก็บวันที่ใน AsyncStorage) — 1 ดอกต่อสัปดาห์ที่เล่นครบ 3 วัน, มี 5 ระยะ (เมล็ด → ต้นกล้า → ต้นเล็ก → ต้นใหญ่ → ต้นออกดอก), **ไม่เหี่ยว ไม่รีเซ็ต ไม่มี streak ที่ขาดได้** — ตรงกับกติกาใน MVP1

ไม่มีเมนูตั้งค่า มีแค่ไอคอนเล็ก "เกี่ยวกับ" มุมล่าง (ชื่อแอป เวอร์ชัน ลิงก์ privacy/support, เปลี่ยนชื่อเรียก) — ซ่อนไว้ไม่ให้กดโดนง่าย

---

## 2. เกมที่เสนอ: **"ตาไว" (Quick Eye แบบนุ่มนวล)**

> ภาพโผล่ขึ้นกลางจอแป๊บเดียว → หายไป → "เมื่อกี้เห็นอะไร?" เลือกจาก 2–4 ภาพใหญ่

**ทำไมเกมนี้:**
- เป็นเกมฝึกหลักใน MVP1 อยู่แล้ว (speed-of-processing) → งานที่ทำวันนี้ไม่ทิ้ง ต่อยอดเป็น staircase/frame-timing ได้เลย
- **ไม่ซ้ำกับ 3 task ของ monthly check-in** (Symbol match, Picture memory, Go/No-go) → ไม่ทำให้เกิด practice effect ตอนเริ่มตรวจจริง. ส่วนเกมจับคู่ภาพ/พลิกการ์ดจะใกล้กับ Picture memory เกินไป จึงไม่เลือก
- ไม่ต้องอ่านหนังสือ ไม่ต้องใช้รูปครอบครัว ใช้ภาพที่ฝังในแอป

**กติกา (ไม่กดดัน):**
- 1 รอบ = 10 ภาพ (~2–3 นาที). จับเวลา**เฉพาะตอนแสดงภาพ** ไม่จับเวลาตอนตอบ
- เริ่มช้า (แสดง 1.5 วินาที, 2 ตัวเลือก) แล้วปรับเองเงียบๆ ทีละขั้น ให้ถูกราว 80% (2-down/1-up) — ระดับเก็บในเครื่อง
- ตอบผิด → ตัวเลือกนั้นจางหาย ภาพที่ถูกเด้งเบาๆ "อันนี้นะ" ไม่มีเสียงผิด ไม่มีกากบาท
- **ไม่มีคะแนน ไม่มีตัวเลข ไม่มีอันดับ** — จบรอบบอกแค่ว่าต้นไม้โต
- คำสั่งทุกหน้ามีเสียงอ่าน (expo-speech; ถ้าเครื่องไม่มีเสียงภาษานั้นให้ซ่อนปุ่มลำโพง)
- Haptic เบาๆ ตอนตอบถูก

**ภาพ:** ชุดของคุ้นตา ~60 ภาพ แบ่งหมวด (ผลไม้ไทย, สัตว์, ของในบ้าน, อาหาร) จาก **Microsoft Fluent Emoji (MIT license)** แปลงเป็น PNG ฝังในแอป — ใช้ได้เชิงพาณิชย์ ใส่ credit ในหน้า "เกี่ยวกับ". สุ่มชุดไม่ซ้ำในวันเดียวกัน

---

## 3. Theme (ตาม mockup)

| Token | ค่า |
|---|---|
| `bg` | `#F6F4EF` |
| `surface` | `#FFFFFF` |
| `primary` / pressed | `#1D6B63` / `#134C46` |
| `primarySoft` | `#E3EFEC` (ใบไม้, chip ที่เลือก) |
| `accent` | `#E07A3F` (ดอกไม้) |
| `warmSoft` / border | `#FBEBDD` / `#E8C3A0` |
| `text` / `textMuted` | `#1E2422` / `#4F5753` |
| `border` | `#D9D5CC` |
| `trunk` | `#8A6A4E` |

- โลโก้: เปลี่ยนเป็นเขียว `#1D6B63` แล้ว → `design/brand/logo.png` (พื้น `#F6F4EF`), `design/brand/logo-transparent.png`
- **App icon:** wordmark อ่านไม่ออกบนไอคอนเล็ก → ใช้สัญลักษณ์ต้นไม้วงกลมจาก mockup (ทรงพุ่ม `#E3EFEC` ขอบ `#1D6B63` ดอก `#E07A3F`) บนพื้น `#F6F4EF`; splash = wordmark เขียว
- ฟอนต์: Atkinson Hyperlegible (EN) + IBM Plex Sans Thai Looped (TH) ฝังในแอป (OFL)
- ขนาด: body 22pt, หัวข้อ 32pt, ปุ่ม ≥ 72pt สูง, รองรับ Dynamic Type, contrast AA, เคารพ Reduce Motion

---

## 4. Tech

- `apps/mobile` — Expo SDK ล่าสุด + Expo Router + TypeScript (เตรียม groups `(player)` ไว้สำหรับ MVP1)
- Libraries: `react-native-reanimated`, `react-native-svg` (ต้นไม้), `expo-speech`, `expo-haptics`, `expo-font`, `@react-native-async-storage/async-storage`, `i18next` + `react-i18next` + `expo-localization`
- **ไม่ใส่** analytics, crash reporting, ads, notifications, network library ใดๆ (ถ้าใส่ = ต้องแก้ Privacy Label)
- `ios.supportsTablet: false`, portrait only, `ITSAppUsesNonExemptEncryption: false`
- Bundle ID / package: `com.renzoft.reminiz`, ชื่อแอป **Reminiz**
- `site/` — หน้าเว็บ static 2 หน้า `/privacy` และ `/support` (TH/EN) deploy บน Vercel ที่ **reminiz.renzoft.com**
- EAS Build + EAS Submit

---

## 5. แผนรายวัน

| วัน | งาน | เสร็จเมื่อ |
|---|---|---|
| **D1** | Scaffold, theme + ฟอนต์ + component (BigButton, Screen, SpeakButton), i18n TH/EN, หน้าแรกเลือกชื่อเรียก, หน้าหลัก, ต้นไม้ SVG 5 ระยะ + ดอกไม้ + อนิเมชันโต, storage วันที่เล่น | เปิดแอปเห็นหน้าหลักสวยตาม mockup ทั้ง 2 ภาษา |
| **D2** | เกมตาไว: ชุดภาพ, flow แสดง→ซ่อน→เลือก, staircase, errorless feedback, เสียงอ่าน, หน้าจบรอบ, ต่อกับต้นไม้ | เล่นจบรอบแล้วต้นไม้โต |
| **D3** | QA บนเครื่องจริง (iPhone SE ขนาดเล็ก + iPhone ใหญ่ + Android 1 เครื่อง) + ให้ผู้สูงอายุจริงลอง 1–2 คน, ตัวหนังสือใหญ่สุด (Dynamic Type), app icon/splash, site privacy/support บน Vercel, screenshot, metadata, EAS build → TestFlight / internal track → **Submit ทั้ง 2 store** | สถานะ Waiting for Review |

---

## 6. Checklist กัน reject

ความเสี่ยงหลักที่เหลือมีแค่ **4.2 Minimum Functionality** (แอปเรียบเกินไป) และ **1.4.1 / คำโฆษณาด้านสุขภาพ** — จัดการดังนี้

- [ ] **4.2:** วางเป็น *เกม* (หมวด Games › Puzzle, รอง Family) ไม่ใช่ utility — เกมเรียบๆ ผ่านได้ปกติ; ต้องมีของจริงให้เล่น: ภาพ ~60 ภาพ, ความยากปรับเอง, ต้นไม้โตต่อเนื่องหลายสัปดาห์, เสียงอ่าน, 2 ภาษา. ไม่มีปุ่มที่ยังไม่เสร็จ ไม่มี "เร็วๆ นี้" ไม่มี placeholder
- [ ] **คำในแอปและ metadata ห้ามมี:** อัลไซเมอร์, สมองเสื่อม, dementia, ป้องกัน/ชะลอ/รักษา, "clinically proven", "ช่วยให้ความจำดีขึ้น". ใช้ได้: "เกมฝึกตาไวง่ายๆ วันละ 3 นาที", "ปลูกต้นไม้ไปกับการเล่นทุกวัน", "ออกแบบให้ผู้สูงอายุเล่นง่าย"
- [ ] Privacy policy URL + Support URL ใช้งานได้จริง (Apple บังคับทุกแอป)
- [ ] App Privacy = **Data Not Collected**; Google Play Data safety = ไม่เก็บ ไม่แชร์
- [ ] Age rating 4+ (ไม่เลือก Kids category — มีกฎเพิ่ม)
- [ ] ไม่ขอ permission ใดๆ เลย (ไม่มีกล้อง/รูป/แจ้งเตือน)
- [ ] ไม่ crash ตอนเปิดครั้งแรก, ตอน Dynamic Type ใหญ่สุด, ตอนสลับแอปกลางเกม
- [ ] Review Notes: "No account needed. Open the app and tap Play today."
- [ ] ชื่อ "Reminiz" ว่างใน App Store Connect (จองชื่อวันนี้)
- [ ] Google Play: target SDK ล่าสุด, ภาพ feature graphic 1024×500, บัญชีนิติบุคคลส่ง production ได้ทันที

---

## 7. ทางต่อ MVP1
เพิ่มทีละชั้นบนแอปเดิม: Supabase + email OTP ฝั่งครอบครัว, pairing → เครื่องนี้กลายเป็น player mode (ต้นไม้และวันที่เล่นที่สะสมไว้ในเครื่อง sync ขึ้นไปได้), จดหมาย, check-in, Change Engine, report/PDF, portal. เกมตาไวเพิ่ม frame-timing + บันทึก `game_sessions`
