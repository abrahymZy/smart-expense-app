import { CURRENCY_SYMBOL } from "@/types/expense";

/**
 * تنسيق المبالغ المالية وفق وثيقة المشروع: "5,500 ﷼"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${CURRENCY_SYMBOL}`;
  }

  // تنسيق الأرقام مع فواصل الآلاف
  const formattedNumber = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return `${formattedNumber} ${CURRENCY_SYMBOL}`;
}
