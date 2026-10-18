// lib/parser/local-parser.ts
// محلل محلي سريع للغة العربية وفق متطلبات الفحص الهجين بدون إنترنت

import {
  ParsedExpenseItem,
  ParsingResult,
  DEFAULT_CURRENCY,
  PaymentMethod,
} from "@/types/expense";

/**
 * تحويل الأرقام العربية المشرقية والفارسية إلى أرقام إنجليزية معيارية
 */
export function normalizeArabicNumbers(str: string): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicDigits[i], "g"), i.toString());
    result = result.replace(new RegExp(persianDigits[i], "g"), i.toString());
  }
  return result;
}

/**
 * تصنيف ذكي تلقائي بناءً على الكلمات الشائعة
 */
function inferCategory(itemText: string): string {
  const text = itemText.toLowerCase();

  const categories: Record<string, string[]> = {
    طعام: [
      "قهوة", "فطور", "غداء", "عشاء", "سندوتش", "شاي", "ماء", "عصير",
      "مطعم", "اكل", "وجبة", "فلافل", "شاورما", "كيك", "حلوى", "خبز",
      "بقالة", "سوبرماركت", "خضار", "فواكه", "لحم", "دجاج", "سمك"
    ],
    مواصلات: [
      "مواصلات", "تاكسي", "باص", "بنزين", "بترول", "ديزل", "مشوار",
      "سيارة", "اوبر", "كريم", "توصيل", "سفر", "تذكرة", "موقف"
    ],
    تسوق: [
      "تسوق", "ملابس", "ثوب", "قميص", "بنطلون", "حذاء", "جزمة",
      "عطر", "ساعة", "حقيبة", "شنطة", "نظارة", "اكسسوار"
    ],
    فواتير: [
      "فاتورة", "فواتير", "كهرباء", "انترنت", "نت", "رصيد", "شحن",
      "باقة", "غاز", "تلفون", "اشتراك", "واي فاي"
    ],
    صحة: [
      "دواء", "علاج", "صيدلية", "دكتور", "طبيب", "مستشفى", "عيادة",
      "فحص", "تحليل", "نظارات", "اسنان"
    ],
    تعليم: [
      "كتب", "كتاب", "دفتر", "اقلام", "مدرسة", "جامعة", "دورة",
      "كورس", "تسجيل", "شهادة", "تدريب"
    ],
    منزل: [
      "ايجار", "منزل", "بيت", "شقة", "صيانة", "سباكة", "تنظيف",
      "اثاث", "ستائر", "مطبخ", "ادوات"
    ],
    ترفيه: [
      "سينما", "فيلم", "العاب", "رحلة", "نزهة", "متنزه", "حديقة",
      "كافيه", "حفلة"
    ]
  };

  for (const [catName, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return catName;
    }
  }

  return "أخرى";
}

/**
 * تنظيف نصوص العناصر وإزالة حروف الجر وأدوات الإدخال الزائدة
 */
function cleanItemName(name: string): string {
  let cleaned = name.trim();
  // إزالة كلمات مثل: بـ ، لـ ، على ، في ، حق ، حق الـ
  cleaned = cleaned.replace(/^(بـ|ب|لـ|ل|على|في|حق|من)\s*/i, "");
  cleaned = cleaned.replace(/^(ال)/, "ال");
  return cleaned.trim();
}

/**
 * المحلل المحلي للغة العربية
 */
export function parseExpenseLocally(rawInput: string): ParsingResult {
  const today = new Date().toISOString().split("T")[0];
  let normalized = normalizeArabicNumbers(rawInput.trim());

  // إزالة الكلمات الزائدة في البداية مثل (اليوم، أمس، صرفت، دفعت، اشتريت)
  const introPattern = /^(اليوم|امس|أمس|حالياً)?\s*(صرفت|دفعت|اشتريت|دفعنا|صرفنا|شريت)?\s*/i;
  
  // معالجة علامات العملة الشائعة لجعل الأرقام مجردة
  // استبدال "ريال يمني"، "ريال"، "﷼" بفراغ مع الاحتفاظ بالأرقام
  const cleanInput = normalized.replace(/\b(ريال\s+يمني|ريال|YER|﷼)\b/gi, " ");

  // 1. فحص الحالات الغامضة مثل "دفعت 500" أو "صرفت 1000" دون ذكر اسم العنصر
  const onlyAmountMatch = cleanInput.match(/^(?:اليوم\s+)?(?:صرفت|دفعت|اشتريت|دفعنا|صرفنا)?\s*(\d+(?:\.\d+)?)\s*$/i);
  if (onlyAmountMatch) {
    const amt = parseFloat(onlyAmountMatch[1]);
    return {
      expenses: [],
      confidence: 0.3,
      needs_clarification: true,
      clarification_question: `ما الذي دفعت عليه ${amt} ريال؟`,
      raw_text: rawInput,
      source: "local",
    };
  }

  // 2. فحص الحالات المجمعة بمبلغ إجمالي واحد دون تجزئة
  // مثل: "اشتريت فطور وقهوة بـ1000" أو "فطور وقهوة 1000"
  const multiItemSingleAmount = cleanInput.match(
    /(?:اشتريت|دفعت|صرفت|شريت)?\s*([^\d]+?)\s*(?:بـ|ب|بقيمة|بمبلغ|=)?\s*(\d+(?:\.\d+)?)\s*$/i
  );

  if (multiItemSingleAmount) {
    const rawItemsText = multiItemSingleAmount[1].replace(introPattern, "").trim();
    const amount = parseFloat(multiItemSingleAmount[2]);

    // إذا كان يحتوي على حرف العطف "و" بين كلمتين أو أكثر
    if (rawItemsText.includes(" و")) {
      const items = rawItemsText
        .split(/\s+و\s+/)
        .map((s) => cleanItemName(s))
        .filter(Boolean);

      if (items.length > 1) {
        return {
          expenses: [
            {
              item: items.join(" و"),
              items: items,
              amount: amount,
              currency: DEFAULT_CURRENCY,
              category: inferCategory(items[0]),
              payment_method: "نقدًا",
              location: null,
              notes: null,
              date: today,
            },
          ],
          confidence: 0.95,
          needs_clarification: false,
          clarification_question: null,
          raw_text: rawInput,
          source: "local",
        };
      }
    }
  }

  // 3. تحليل الجمل التي قد تحتوي على مصروفات متعددة مفصولة بـ (و) أو (فاصلة)
  // مثل: "300 قهوة و500 فطور" أو "اليوم صرفت 1500 على المواصلات و500 على القهوة"
  const segments = cleanInput
    .replace(introPattern, "")
    .split(/\s+و(?=\s*\d|\s*[أ-ي]+(?:\s+بـ?\d|\s+\d))\s*|،|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedItems: ParsedExpenseItem[] = [];

  for (const seg of segments) {
    let itemMatch: { item: string; amount: number } | null = null;

    // صيغة أ: "300 قهوة" أو "300 على القهوة" أو "500 للفطور"
    const patternA = /^(\d+(?:\.\d+)?)\s*(?:لـ|ل|على|في)?\s*([^\d]+)$/i;
    // صيغة ب: "قهوة 300" أو "فطور بـ500" أو "دفعت 500 على الفطور"
    const patternB = /^([^\d]+?)\s*(?:بـ|ب|بقيمة|بمبلغ)?\s*(\d+(?:\.\d+)?)$/i;
    // صيغة ج: "دفعت 500 للفطور" أو "صرفنا 500 على الفطور"
    const patternC = /(?:دفعت|صرفت|شريت|اشتريت)?\s*(\d+(?:\.\d+)?)\s*(?:لـ|ل|على|في|حق)?\s*([^\d]+)/i;

    const matchA = seg.match(patternA);
    const matchB = seg.match(patternB);
    const matchC = seg.match(patternC);

    if (matchA) {
      itemMatch = {
        amount: parseFloat(matchA[1]),
        item: cleanItemName(matchA[2]),
      };
    } else if (matchB) {
      itemMatch = {
        item: cleanItemName(matchB[1]),
        amount: parseFloat(matchB[2]),
      };
    } else if (matchC && matchC[1] && matchC[2]) {
      itemMatch = {
        amount: parseFloat(matchC[1]),
        item: cleanItemName(matchC[2]),
      };
    }

    if (itemMatch && itemMatch.item && itemMatch.amount > 0) {
      parsedItems.push({
        item: itemMatch.item,
        amount: itemMatch.amount,
        currency: DEFAULT_CURRENCY,
        category: inferCategory(itemMatch.item),
        payment_method: "نقدًا",
        location: null,
        notes: null,
        date: today,
      });
    }
  }

  if (parsedItems.length > 0) {
    return {
      expenses: parsedItems,
      confidence: 0.95,
      needs_clarification: false,
      clarification_question: null,
      raw_text: rawInput,
      source: "local",
    };
  }

  // إذا لم يتم استخراج أي شيء بوضوح
  return {
    expenses: [],
    confidence: 0,
    needs_clarification: true,
    clarification_question: "ما الذي صرفت عليه وبكم؟",
    raw_text: rawInput,
    source: "local",
  };
}
