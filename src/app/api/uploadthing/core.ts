
// import { db } from "@/db";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { index } from "@/lib/pinecone"; // Pinecone index import
// import { PineconeStore } from "@langchain/pinecone";
// import { HfInference } from "@huggingface/inference";
// import xml2js from "xml2js"; // Import xml2js for XML parsing

// const f = createUploadthing();
// const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); // Initialize Hugging Face client

// const middleware = async () => {
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user || !user.id) throw new Error("Unauthorized");

//   return { userId: user.id };
// };

// // Upload handler to process PDF or XML files, extract embeddings, and store in Pinecone
// const onUploadComplete = async ({
//   metadata,
//   file,
// }: {
//   metadata: Awaited<ReturnType<typeof middleware>>; 
//   file: { key: string; name: string; url: string };
// }) => {
//   const isFileExist = await db.file.findFirst({
//     where: { key: file.key },
//   });

//   const createdFile = await db.file.create({
//     data: {
//       key: file.key,
//       name: file.name,
//       userId: metadata.userId,
//       url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
//       uploadStatus: "PROCESSING",
//     },
//   });

//   try {
//     console.log("Fetching file from URL:", createdFile.url);

//     const fileUrl = `https://utfs.io/f/${file.key}`; // Adjust the URL format

//     const response = await fetch(fileUrl);
//     const contentType: string | null = response.headers.get("Content-Type");

//     const blob = await response.blob();
//     console.log("Blob received:", blob);

//     let pageLevelDocs;
//     if (contentType && contentType.includes("application/pdf")) {
//       // Handle PDF files
//       const loader = new PDFLoader(blob);
//       pageLevelDocs = await loader.load();
//       console.log("PDF loaded successfully:", pageLevelDocs);
//     } else if (contentType && contentType.includes("application/xml")) {
//       // Handle XML files
//       const xmlContent = await blob.text();
//       const parsedXML = await xml2js.parseStringPromise(xmlContent);
//       console.log("XML parsed successfully:", parsedXML);

//       pageLevelDocs = [
//         {
//           pageContent: JSON.stringify(parsedXML),
//           metadata: {},
//         },
//       ];
//       console.log("XML loaded successfully:", pageLevelDocs);
//     } else {
//       throw new Error("Unsupported file type");
//     }

//     // Generate embeddings for each document page
//     const embeddedDocs = await Promise.all(
//       pageLevelDocs.map(async (doc) => {
//         const embeddingResponse = await hf.featureExtraction({
//           model: "sentence-transformers/paraphrase-MiniLM-L6-v2", // Use appropriate model
//           inputs: doc.pageContent,
//         });

//         console.log("Embedding generated:", embeddingResponse);

//         if (!Array.isArray(embeddingResponse)) {
//           throw new Error("Failed to generate embeddings");
//         }

//         return {
//           ...doc,
//           vector: embeddingResponse as number[], // Ensure correct embedding format
//         };
//       })
//     );

//     const namespace = String(createdFile.id);

//     await PineconeStore.fromDocuments(
//       embeddedDocs.map((doc) => ({
//         pageContent: doc.pageContent,
//         metadata: doc.metadata || {},
//       })),
//       {
//         embedQuery: async (query) => {
//           console.log(query);
//           const embeddingResponse = await hf.featureExtraction({
//             model: "sentence-transformers/paraphrase-MiniLM-L6-v2", // Use same model for query embeddings
//             inputs: query,
//           });

//           return embeddingResponse as number[];
//         },
//         embedDocuments: async (documents: string[]): Promise<number[][]> => {
//           const embeddings = await Promise.all(
//             documents.map(async (doc) => {
//               console.log(doc);
//               const embeddingResponse = await hf.featureExtraction({
//                 model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
//                 inputs: doc,
//               });

//               if (!Array.isArray(embeddingResponse)) {
//                 throw new Error("Failed to generate embedding for document.");
//               }

//               return embeddingResponse as number[];
//             })
//           );

//           return embeddings;
//         },
//       },
//       {
//         pineconeIndex: index,
//         namespace,
//       }
//     );

//     console.log("Documents indexed in Pinecone successfully.");
//     await db.file.update({
//       data: { uploadStatus: "SUCCESS" },
//       where: { id: createdFile.id },
//     });
//     console.log("Database updated with upload success.");
//   } catch (err) {
//     console.error("Error during document processing:", err);
//     await db.file.update({
//       data: { uploadStatus: "FAILED" },
//       where: { id: createdFile.id },
//     });
//   }
// };

// // Similarity search for retrieving context from Pinecone and sending it to LLM for response generation
// export const queryHandler = async (message: string, fileId: string, userId: string) => {
//   try {
//     // Step 1: Perform similarity search on Pinecone to get the most relevant documents
//     const vectorStore = await PineconeStore.fromExistingIndex({
//       embedQuery: async (text: string) => {
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
//       },
//     }, {
//       pineconeIndex: index,
//       namespace: String(fileId), // Ensure namespace corresponds to the fileId
//     });

//     // Perform similarity search with the user message to retrieve the top relevant document chunks
//     const results = await vectorStore.similaritySearch(message, 4); // Search for the top 4 relevant document chunks
//     console.log("Similarity search results:", results);

//     // Step 2: Build context for LLM model by combining only the relevant document chunks
//     const context = results
//       .map((r: { pageContent: string }) => r.pageContent) // Only add relevant document content
//       .join("\n\n");

//     // Step 3: Generate response using Hugging Face (or another LLM model)
//     const response = await hf.textGeneration({
//         // model: "google/flan-t5-large", // Use a smaller model
// //       // model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
// //       // model: "Qwen/QwQ-32B-Preview",
//       model:"meta-llama/Llama-3.2-3B-Instruct",
//       // model: "mistralai/Mistral-Nemo-Instruct-2407",
//       // model: "tiiuae/falcon-7b-instruct",
        
//       inputs: `USER QUESTION: ${message}\nCONTEXT:\n${context}\nANSWER:`, // Ask the model to return only the answer
//       parameters: { max_length: 1500, temperature: 0.2 },
//     });

//     const completion = response.generated_text || "No response generated.";

//     // Step 4: Extract the relevant answer (this assumes the model returns only the answer)
//     const answer = completion.trim(); // Trim any excess whitespace

//     return answer || "No relevant answer found."; // Return only the answer
//   } catch (err) {
//     console.error("Error during query handling:", err);
//     return "Error processing your request.";
//   }
// };

// // Export router for file uploads
// export const ourFileRouter = {
//   pdfUploader: f({ pdf: { maxFileSize: "64MB" } })
//     .middleware(middleware)
//     .onUploadComplete(onUploadComplete),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;




// ////////////////////////////////////////////////////////


// // /* core.ts */

// import { db } from "@/db";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { index } from "@/lib/pinecone"; // Pinecone index import
// import { PineconeStore } from "@langchain/pinecone";
// import { HfInference } from "@huggingface/inference";
// import xml2js from "xml2js"; // Import xml2js for XML parsing

// const f = createUploadthing();
// const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); // Initialize Hugging Face client

// const middleware = async () => {
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user || !user.id) throw new Error("Unauthorized");

//   return { userId: user.id };
// };

// const onUploadComplete = async ({
//   metadata,
//   file,
// }: {
//   metadata: Awaited<ReturnType<typeof middleware>>;
//   file: { key: string; name: string; url: string };
// }) => {
//   const isFileExist = await db.file.findFirst({
//     where: { key: file.key },
//   });

//   const createdFile = await db.file.create({
//     data: {
//       key: file.key,
//       name: file.name,
//       userId: metadata.userId,
//       url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
//       uploadStatus: "PROCESSING",
//     },
//   });

//   try {
//     console.log("Fetching file from URL:", createdFile.url);

//     const fileUrl = `https://utfs.io/f/${file.key}`; // Adjust the URL format

//     const response = await fetch(fileUrl);
//     const contentType: string | null = response.headers.get("Content-Type");

//     const blob = await response.blob();
//     console.log("Blob received:", blob);

//     let pageLevelDocs;
//     if (contentType && contentType.includes("application/pdf")) {
//       const loader = new PDFLoader(blob);
//       pageLevelDocs = await loader.load();
//       console.log("PDF loaded successfully:", pageLevelDocs);
//     } else if (contentType && contentType.includes("application/xml")) {
//       const xmlContent = await blob.text();
//       const parsedXML = await xml2js.parseStringPromise(xmlContent);
//       console.log("XML parsed successfully:", parsedXML);

//       pageLevelDocs = [
//         {
//           pageContent: JSON.stringify(parsedXML),
//           metadata: {},
//         },
//       ];
//       console.log("XML loaded successfully:", pageLevelDocs);
//     } else {
//       throw new Error("Unsupported file type");
//     }

//     const embeddedDocs = await Promise.all(
//       pageLevelDocs.map(async (doc) => {
//         const embeddingResponse = await hf.featureExtraction({
//           model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
//           inputs: doc.pageContent,
//         });

//         console.log("Embedding generated:", embeddingResponse);

//         if (!Array.isArray(embeddingResponse)) {
//           throw new Error("Failed to generate embeddings");
//         }

//         return {
//           ...doc,
//           vector: embeddingResponse as number[],
//         };
//       })
//     );

//     const namespace = String(createdFile.id);

//     await PineconeStore.fromDocuments(
//       embeddedDocs.map((doc) => ({
//         pageContent: doc.pageContent,
//         metadata: doc.metadata || {},
//       })),
//       {
//         embedQuery: async (query) => {
//           console.log(query);
//           const embeddingResponse = await hf.featureExtraction({
//             model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
//             inputs: query,
//           });

//           return embeddingResponse as number[];
//         },
//         embedDocuments: async (documents: string[]): Promise<number[][]> => {
//           const embeddings = await Promise.all(
//             documents.map(async (doc) => {
//               console.log(doc);
//               const embeddingResponse = await hf.featureExtraction({
//                 model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
//                 inputs: doc,
//               });

//               if (!Array.isArray(embeddingResponse)) {
//                 throw new Error("Failed to generate embedding for document.");
//               }

//               return embeddingResponse as number[];
//             })
//           );

//           return embeddings;
//         },
//       },
//       {
//         pineconeIndex: index,
//         namespace,
//       }
//     );

//     console.log("Documents indexed in Pinecone successfully.");
//     await db.file.update({
//       data: { uploadStatus: "SUCCESS" },
//       where: { id: createdFile.id },
//     });
//     console.log("Database updated with upload success.");
//   } catch (err) {
//     console.error("Error during document processing:", err);
//     await db.file.update({
//       data: { uploadStatus: "FAILED" },
//       where: { id: createdFile.id },
//     });
//   }
// };

// export const queryHandler = async (message: string, fileId: string, userId: string) => {
//   try {
//     const vectorStore = await PineconeStore.fromExistingIndex({
//       embedQuery: async (text: string) => {
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
//       },
//     }, {
//       pineconeIndex: index,
//       namespace: String(fileId),
//     });

//     const results = await vectorStore.similaritySearch(message, 4);
//     console.log("Similarity search results:", results);

//     const context = results
//       .map((r: { pageContent: string }) => r.pageContent)
//       .join("\n\n");

//     const response = await hf.textGeneration({
//       model: "meta-llama/Llama-3.2-3B-Instruct",
//       inputs: `USER QUESTION: ${message}\nCONTEXT:\n${context}\nANSWER:`,
//       parameters: { max_length: 1500, temperature: 0.2 },
//     });

//     const completion = response.generated_text || "No response generated.";

//     const answer = completion.trim();

//     return answer || "No relevant answer found.";
//   } catch (err) {
//     console.error("Error during query handling:", err);
//     return "Error processing your request.";
//   }
// };

// export const ourFileRouter = {
//   pdfUploader: f({ pdf: { maxFileSize: "64MB" } })
//     .middleware(middleware)
//     .onUploadComplete(onUploadComplete),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;







// /* core.ts */

import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { index } from "@/lib/pinecone"; // Pinecone index import
import { PineconeStore } from "@langchain/pinecone";
import { HfInference } from "@huggingface/inference";
import xml2js from "xml2js"; // Import xml2js for XML parsing

const f = createUploadthing();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY); // Initialize Hugging Face client

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  return { userId: user.id };
};

const onUploadComplete = async ( {
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: { key: string; name: string; url: string };
}) => {
  const isFileExist = await db.file.findFirst({
    where: { key: file.key },
  });

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    console.log("Fetching file from URL:", createdFile.url);

    const fileUrl = `https://utfs.io/f/${file.key}`; // Adjust the URL format

    const response = await fetch(fileUrl);
    const contentType: string | null = response.headers.get("Content-Type");

    const blob = await response.blob();
    console.log("Blob received:", blob);

    let pageLevelDocs;
    if (contentType && contentType.includes("application/pdf")) {
      const loader = new PDFLoader(blob);
      pageLevelDocs = await loader.load();
      console.log("PDF loaded successfully:", pageLevelDocs);
    } else if (contentType && contentType.includes("application/xml")) {
      const xmlContent = await blob.text();
      const parsedXML = await xml2js.parseStringPromise(xmlContent);
      console.log("XML parsed successfully:", parsedXML);

      pageLevelDocs = [
        {
          pageContent: JSON.stringify(parsedXML),
          metadata: {},
        },
      ];
      console.log("XML loaded successfully:", pageLevelDocs);
    } else {
      throw new Error("Unsupported file type");
    }

    const embeddedDocs = await Promise.all(
      pageLevelDocs.map(async (doc) => {
        const embeddingResponse = await hf.featureExtraction({
          model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
          inputs: doc.pageContent,
        });

        console.log("Embedding generated:", embeddingResponse);

        if (!Array.isArray(embeddingResponse)) {
          throw new Error("Failed to generate embeddings");
        }

        return {
          ...doc,
          vector: embeddingResponse as number[],
        };
      })
    );

    const namespace = String(createdFile.id);

    await PineconeStore.fromDocuments(
      embeddedDocs.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata || {},
      })),
      {
        embedQuery: async (query) => {
          console.log(query);
          const embeddingResponse = await hf.featureExtraction({
            model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
            inputs: query,
          });

          return embeddingResponse as number[];
        },
        embedDocuments: async (documents: string[]): Promise<number[][]> => {
          const embeddings = await Promise.all(
            documents.map(async (doc) => {
              console.log(doc);
              const embeddingResponse = await hf.featureExtraction({
                model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
                inputs: doc,
              });

              if (!Array.isArray(embeddingResponse)) {
                throw new Error("Failed to generate embedding for document.");
              }

              return embeddingResponse as number[];
            })
          );

          return embeddings;
        },
      },
      {
        pineconeIndex: index,
        namespace,
      }
    );

    console.log("Documents indexed in Pinecone successfully.");
    await db.file.update({
      data: { uploadStatus: "SUCCESS" },
      where: { id: createdFile.id },
    });
    console.log("Database updated with upload success.");
  } catch (err) {
    console.error("Error during document processing:", err);
    await db.file.update({
      data: { uploadStatus: "FAILED" },
      where: { id: createdFile.id },
    });
  }
};

export const queryHandler = async (message: string, fileId: string, userId: string) => {
  try {
    // Check for greeting queries
    const greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening"];
    if (greetings.some((greeting) => message.toLowerCase().includes(greeting))) {
      return "Hello! How can I assist you today?";
    }

    // Handle queries with document context
    const vectorStore = await PineconeStore.fromExistingIndex(
      {
        embedQuery: async (text: string) => {
          const embeddingResponse = await hf.featureExtraction({
            model: "sentence-transformers/paraphrase-MiniLM-L6-v2",
            inputs: text,
          });
          if (Array.isArray(embeddingResponse)) {
            return embeddingResponse as number[];
          }
          throw new Error("Invalid embedding format");
        },
        embedDocuments: function (documents: string[]): Promise<number[][]> {
          throw new Error("Function not implemented.");
        },
      },
      {
        pineconeIndex: index,
        namespace: String(fileId),
      }
    );

    const results = await vectorStore.similaritySearch(message, 4);
    console.log("Similarity search results:", results);

    const context = results
      .map((r: { pageContent: string }) => r.pageContent)
      .join("\n\n");

    const response = await hf.textGeneration({
      // model: "meta-llama/Llama-3.2-3B-Instruct",
       model: "google/flan-t5-large", // Use a smaller model
       // model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
       // model: "Qwen/QwQ-32B-Preview",
       // model: "mistralai/Mistral-Nemo-Instruct-2407",
       // model: "tiiuae/falcon-7b-instruct",
      inputs: `USER QUESTION: ${message}\nCONTEXT:\n${context}\nANSWER:`,
      parameters: { max_length: 1500, temperature: 0.2 },
    });

    const completion = response.generated_text || "No response generated.";

    const answer = completion.trim();

    return answer || "No relevant answer found.";
  } catch (err) {
    console.error("Error during query handling:", err);
    return "Error processing your request.";
  }
};

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "64MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
