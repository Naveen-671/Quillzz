
// import { db } from "@/db";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
// import { HfInference } from "@huggingface/inference";
// import { NextRequest } from "next/server";
// import { index } from "@/lib/pinecone";
// import { PineconeStore } from "@langchain/pinecone";

// const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// export const POST = async (req: NextRequest) => {
//   try {
//     const body = await req.json();
//     const { getUser } = getKindeServerSession();
//     const user = await getUser();
//     const { id: userId } = user;

//     if (!userId) {
//       return new Response("Unauthorized", { status: 401 });
//     }

//     const { fileId, message } = SendMessageValidator.parse(body);

//     const file = await db.file.findFirst({ where: { id: fileId, userId } });
//     if (!file) {
//       return new Response("Not found", { status: 404 });
//     }

//     await db.message.create({
//       data: { text: message, isUserMessage: true, userId, fileId },
//     });

//     // Call the queryHandler with only the current message (no previous context)
//     const response = await queryHandler(message, fileId, userId);

//     await db.message.create({
//       data: { text: response, isUserMessage: false, fileId, userId },
//     });

//     return new Response(response, { status: 200 });
//   } catch (err) {
//     console.error("Error occurred:", err);
//     const errorMessage = (err as Error).message || "Internal Server Error";
//     return new Response(errorMessage, { status: 500 });
//   }
// };

// async function queryHandler(message: string, fileId: string, userId: string): Promise<string> {
//   try {
//     // Perform a similarity search based on the current message only (no previous conversation)
//     const vectorStore = await PineconeStore.fromExistingIndex({
//       embedQuery: async (text) => {
//         const embeddingResponse = await hf.featureExtraction({
//           model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
//           inputs: text,
//         });
//         if (Array.isArray(embeddingResponse)) {
//           return embeddingResponse as number[];
//         }
//         throw new Error("Invalid embedding format");
//       },
//       embedDocuments: function (documents: string[]): Promise<number[][]> {
//         throw new Error("Function not implemented.");
//       }
//     }, {
//       pineconeIndex: index,
//       namespace: String(fileId),
//     });

//     const results = await vectorStore.similaritySearch(message, 4); // Top 4 relevant documents based on current query

//     const context = [
//       "Use the following context to answer the user's question.",
//       `\n--------\nCONTEXT:\n${results.map((r) => r.pageContent).join("\n\n")}`,
//     ].join("\n");

//     const response = await hf.textGeneration({
//         // model: "google/flan-t5-large", // Use a smaller model
//        // model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
//        // model: "Qwen/QwQ-32B-Preview",
//        model:"meta-llama/Llama-3.2-3B-Instruct",
//       //  model: "tiiuae/falcon-7b-instruct",
       
//       // model: "mistralai/Mistral-Nemo-Instruct-2407",
//       inputs: `${context}\nUSER INPUT: ${message}`,
//       parameters: { max_length: 1500, temperature: 0.2 },
//     });

//     const completion = response.generated_text || "No response generated.";
//     return completion;
//   } catch (err) {
//     console.error("Error during query handling:", err);
//     return "Error processing your request.";
//   }
// }






// route.ts
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { HfInference } from "@huggingface/inference";
import { NextRequest } from "next/server";
import { index } from "@/lib/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { queryHandler } from "../uploadthing/core";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const { id: userId } = user;

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { fileId, message } = SendMessageValidator.parse(body);

    const file = await db.file.findFirst({ where: { id: fileId, userId } });
    if (!file) {
      return new Response("Not found", { status: 404 });
    }

    await db.message.create({
      data: { text: message, isUserMessage: true, userId, fileId },
    });

    const response = await queryHandler(message, fileId, userId);

    await db.message.create({
      data: { text: response, isUserMessage: false, fileId, userId },
    });

    return new Response(response, { status: 200 });
  } catch (err) {
    console.error("Error occurred:", err);
    const errorMessage = (err as Error).message || "Internal Server Error";
    return new Response(errorMessage, { status: 500 });
  }
};
