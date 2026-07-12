// const OpenAI = require("openai");

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const getModel = () => process.env.OPENAI_MODEL || "gpt-4.1-mini";

// const safeJsonParse = (text, fallback) => {
//   try {
//     return JSON.parse(text);
//   } catch {
//     return fallback;
//   }
// };

// const buildContextText = ({ ticket, messages = [] }) => {
//   const recentMessages = messages
//     .slice(-8)
//     .map((item) => {
//       return `${item.senderRole}: ${item.message}`;
//     })
//     .join("\n");

//   return `
// Ticket Subject: ${ticket?.subject || ""}
// Ticket Category: ${ticket?.category || ""}
// Ticket Priority: ${ticket?.priority || ""}
// Ticket Status: ${ticket?.status || ""}

// Recent Chat:
// ${recentMessages}
// `;
// };

// const generateSupportSuggestions = async ({ ticket, messages = [] }) => {
//   if (!process.env.OPENAI_API_KEY) {
//     return [
//       "Sorry for the inconvenience. I am checking this for you.",
//       "Please wait for a moment while I verify the details.",
//       "Thank you for your patience. We will update you shortly.",
//     ];
//   }

//   const context = buildContextText({ ticket, messages });

//   const response = await client.responses.create({
//     model: getModel(),
//     instructions:
//       "You are a helpful ecommerce grocery support assistant. Return only valid JSON. Generate 3 short polite support reply suggestions in simple English/Hinglish style.",
//     input: `
// ${context}

// Return JSON only:
// {
//   "suggestions": ["reply 1", "reply 2", "reply 3"]
// }
// `,
//   });

//   const parsed = safeJsonParse(response.output_text || "", {
//     suggestions: [],
//   });

//   const suggestions = Array.isArray(parsed.suggestions)
//     ? parsed.suggestions
//     : [];

//   return suggestions.slice(0, 3).filter(Boolean);
// };

// const generateAutoReply = async ({ ticket, messages = [] }) => {
//   if (!process.env.OPENAI_API_KEY) {
//     return "Sorry for the inconvenience. I am checking this for you and will update you shortly.";
//   }

//   const context = buildContextText({ ticket, messages });

//   const response = await client.responses.create({
//     model: getModel(),
//     instructions:
//       "You are an ecommerce grocery support assistant. Reply politely and briefly. Do not promise fake refunds or delivery times. If details are missing, ask for clarification.",
//     input: context,
//   });

//   return (
//     String(response.output_text || "").trim() ||
//     "Sorry for the inconvenience. I am checking this for you."
//   );
// };

// const isClosingUserMessage = (message) => {
//   const text = String(message || "").trim().toLowerCase();

//   const closingWords = [
//     "ok",
//     "okay",
//     "okk",
//     "thanks",
//     "thank you",
//     "done",
//     "resolved",
//     "fine",
//     "got it",
//     "thik hai",
//     "theek hai",
//     "ठीक है",
//   ];

//   return closingWords.includes(text);
// };

// const shouldTriggerRatingRequest = (message) => {
//   const text = String(message || "").toLowerCase();

//   return (
//     text.includes("rating") ||
//     text.includes("rate us") ||
//     text.includes("feedback") ||
//     text.includes("please rate")
//   );
// };

// module.exports = {
//   generateSupportSuggestions,
//   generateAutoReply,
//   isClosingUserMessage,
//   shouldTriggerRatingRequest,
// };