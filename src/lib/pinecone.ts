

// pinecone.ts

import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index("quillz"); // Replace with your index name

export const getPineconeClient = () => pc;
export { index };

