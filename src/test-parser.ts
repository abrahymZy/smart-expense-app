import { parseExpenseLocally, normalizeArabicNumbers } from "./lib/parser/local-parser";

const testCases = [
  "300 قهوة و500 فطور",
  "فطور 500",
  "500 فطور",
  "فطور بـ500",
  "دفعت 500 للفطور",
  "صرفنا 500 ريال على الفطور",
  "اشتريت فطور وقهوة بـ1000",
  "اليوم صرفت 1500 على المواصلات و500 على القهوة",
  "دفعت 500",
  "٥٠٠ فطور",
];

console.log("=== Running Local Arabic Parser Test Cases ===");
for (const test of testCases) {
  const result = parseExpenseLocally(test);
  console.log(`\nInput: "${test}"`);
  console.log(`Confidence: ${result.confidence}, Needs Clarification: ${result.needs_clarification}`);
  if (result.clarification_question) {
    console.log(`Question: ${result.clarification_question}`);
  }
  console.log(`Extracted Expenses (${result.expenses.length}):`);
  for (const exp of result.expenses) {
    console.log(`  - Item: "${exp.item}", Amount: ${exp.amount} ${exp.currency}, Category: "${exp.category}"${exp.items ? `, Items: [${exp.items.join(", ")}]` : ""}`);
  }
}
