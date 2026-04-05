# 🃏 בסרה — Basra Card Game

<div align="center">

![Basra Game](https://img.shields.io/badge/משחק-בסרה-d4af37?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7wn4O8PC90ZXh0Pjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0055?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)

**משחק בסרה ישראלי קלאסי — נגד מחשב**

[שחק עכשיו](#) • [דיווח על באג](https://github.com/amirnagat/Basra-Card-Game-/issues)

</div>

---

## 📸 תמונות

<div align="center">
<img src="https://placehold.co/800x450/071a0e/d4af37?text=Basra+Card+Game" alt="מסך המשחק" width="80%" />
</div>

---

## ✨ פיצ'רים

- 🎮 **נגד מחשב** — AI חכם שמגן, תוקף ומנסה למנוע ממך בסרה
- 🔥 **בסרה וקומא** — אנימציית אש, screen shake, ו-Impact font pop
- 🃏 **אנימציות קלפים** — חלוקה מהקופה, sweep, hover float
- ⏱️ **טיימר 30 שניות** — עם countdown ring ו-tick sounds
- 🎵 **צלילים** — Web Audio API: שקשוק קלפים, פנפרה בסרה, ווּש
- 🌿 **עיטורים אתיופיים** — רקע גיאומטרי בהשראת אמנות אתיופית קלאסית
- 📱 **ריספונסיבי** — עובד על מובייל ודסקטופ
- 🌐 **RTL מלא** — ממשק עברי מלא עם `lang="he"`

---

## 🎯 חוקי המשחק

### מטרה
לצבור יותר נקודות מהיריב עד שנגמרים כל 52 הקלפים.

### לכידה
| סוג | הסבר |
|---|---|
| **לפי ערך** | קלף X לוכד את כל קלפי X על השולחן |
| **לפי סכום** | קלף X לוכד שילוב קלפים שסכומם X |
| **J (ג'וקר)** | מנקה את כל השולחן — לא עושה בסרה |
| **7 ♦ (קומא)** | מנקה כמו J — עושה קומא בתנאים מיוחדים |

> **Q ו-K** לוכדים רק לפי ערך זהה — לא לפי סכום.

### ניקוד
| קלף / אירוע | נקודות |
|---|---|
| בסרה / קומא | +10 |
| ג'וקר (J) | +1 לכל אחד |
| אס (A) | +1 לכל אחד (×4) |
| 2 ♠ | +2 |
| 10 ♦ | +3 |
| הכי הרבה קלפים | +6 |

---

## 🚀 התקנה מקומית

```bash
# שכפל את הפרויקט
git clone https://github.com/amirnagat/Basra-Card-Game-.git
cd Basra-Card-Game-

# התקן תלויות
npm install

# הפעל בסביבת פיתוח
npm run dev
```

פתח את [http://localhost:5173](http://localhost:5173) בדפדפן.

---

## 🏗️ בנייה לפרודקשן

```bash
npm run build
```

הפלט יהיה בתיקיית `dist/` — מוכן להעלאה לכל CDN סטטי.

---

## 🛠️ טכנולוגיות

| טכנולוגיה | שימוש |
|---|---|
| [React 18](https://react.dev) | ממשק משתמש |
| [Framer Motion](https://www.framer.com/motion/) | כל האנימציות |
| [Tailwind CSS](https://tailwindcss.com) | עיצוב |
| [Lucide React](https://lucide.dev) | אייקונים |
| [Vite](https://vitejs.dev) | bundler |
| Web Audio API | צלילים מובנים — ללא קבצי אודיו |

---

## 📁 מבנה הפרויקט

```
basra-card-game/
├── src/
│   ├── BasraGame.jsx   # כל לוגיקת המשחק, ה-UI והאנימציות
│   ├── main.jsx        # נקודת כניסה
│   └── index.css       # Tailwind imports
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🧠 לוגיקת ה-AI

המחשב פועל לפי סדר עדיפויות:
1. **בסרה** — אם יכול לנקות את השולחן
2. **קומא** — אם 7♦ תנקה בתנאים הנכונים
3. **ג'וקר** — אם יש 3+ קלפים על השולחן
4. **הגנה** — אם השחקן עומד לעשות בסרה, פורק את השולחן
5. **לכידה מקסימלית** — לוכד כמה שיותר קלפים
6. **משחק הגנתי** — מוציא קלף קטן

---

## 👤 יוצר

**אמיר נגט**

---

## 📄 רישיון

פרויקט זה מיועד לשימוש אישי וחינוכי.
