import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CURRENCY, ParsingResult } from "@/types/expense";
import { parseExpenseLocally } from "@/lib/parser/local-parser";

const SYSTEM_PROMPT = `
أنت نظام ذكي متخصص في تحليل نصوص المصروفات باللغة العربية لنظام إدارة المصروفات الذكي.
العملة الرسمية للتطبيق هي: YER (الريال اليمني).

المطلوب منك تحليل نص المستخدم واستخراج المصروفات وإرجاع كائن JSON حصراً بنفس البنية التالية:
{
  "expenses": [
    {
      "item": "اسم المصروف",
      "items": ["عنصر1", "عنصر2"], // اختياري في حال وجود عناصر متعددة بمبلغ واحد مشترك
      "amount": 500, // رقم موجب
      "currency": "YER",
      "category": "طعام", // طعام، مواصلات، تسوق، منزل، صحة، تعليم، ترفيه، فواتير، أخرى
      "payment_method": null, // نقدًا، تحويل بنكي، محفظة إلكترونية، بطاقة، أو null
      "location": null, // اسم المكان إذا ذكر (مثل: مطعم الحاج، سوبرماركت...)
      "notes": null,
      "date": "YYYY-MM-DD"
    }
  ],
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_question": null
}

قواعد صارمة جداً:
1. لا تخترع أو تخمن أي معلومات لم يذكرها المستخدم.
2. إذا ذكر المستخدم عدة عناصر بمبلغ إجمالي واحد دون تفصيل (مثل: "اشتريت فطور وقهوة بـ1000")، لا تقم بتخمين أو توزيع السعر بينهما! بل اجعلها مصروفاً واحداً بمبلغ 1000 وضعهما في قائمة items: ["فطور", "قهوة"].
3. إذا كان النص غامضاً أو ينقصه العنصر (مثل: "دفعت 500")، اجعل needs_clarification = true و clarification_question = "ما الذي دفعت عليه 500 ريال؟" والمصفوفة expenses فارغة [].
4. أرجع JSON فقط بدون أي علامات markdown أو كود إضافي.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "النص مطلوب للتحليل" },
        { status: 400 }
      );
    }

    // أولاً: تشغيل المحلل المحلي السريع
    const localResult = parseExpenseLocally(text);
    if (localResult.confidence >= 0.9 && !localResult.needs_clarification) {
      return NextResponse.json({
        ...localResult,
        source: "local",
      });
    }

    // ثانياً: إذا كان النص يحتاج AI وكان مفتاح Gemini متوفراً في الخادم
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // إرجاع نتيجة المحلل المحلي إذا لم يتوفر مفتاح AI
      return NextResponse.json({
        ...localResult,
        source: "local-fallback",
      });
    }

    // استدعاء Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${SYSTEM_PROMPT}\n\nنص المستخدم:\n"${text}"` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("AI API request failed, falling back to local parser result.");
      return NextResponse.json({
        ...localResult,
        source: "local-fallback",
      });
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ ...localResult, source: "local-fallback" });
    }

    try {
      const parsedAiJson = JSON.parse(candidateText) as ParsingResult;
      return NextResponse.json({
        ...parsedAiJson,
        source: "ai",
        raw_text: text,
      });
    } catch {
      return NextResponse.json({ ...localResult, source: "local-fallback" });
    }
  } catch (error) {
    console.error("AI Parse Route Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة النص" },
      { status: 500 }
    );
  }
}
