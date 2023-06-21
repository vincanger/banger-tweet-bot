import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { Configuration, OpenAIApi } from 'openai';

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

/**
 * NOTE: I was getting parse errors when trying to embed new documents.
 * I played around with the stripNewLines option but that didn't seem to help.
 * In the end, it seems that LangChain parses documents by splitting at punctuation and '\n'
 */
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
export const openai = new OpenAIApi(configuration);
