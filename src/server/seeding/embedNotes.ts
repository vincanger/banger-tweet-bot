import PrismaClient from '@wasp/dbClient';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { PineconeClient } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';


/**
 * With this file we can run `wasp db seed embedNotes` to embed the notes.txt file
 * in './src/shared/docs' and add them to the vector store. This helps for testing 
 * the app and seeding it with some initial data for GPT to generate drafts and ideas from.
*/


/**
 * This must be the same name you'll use to log into the app with.
 * It's probably best to use your twitter handle as your app username.
 */
const NAME_SPACE = 'hot_town';
/**
 * !! don't change this directory! You can replace the notes.txt file with your own though
 * for dev seeding of the vector store.
 */
const SHARED_DIR = './src/shared/docs';

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

const embeddings = new OpenAIEmbeddings({
  // stripNewLines: false,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * we export this function and define it in our main.wasp config file
 * so that we can run it from the command line with `wasp db seed embedNotes`
 */
export const embedNotes = async (prismaClient: typeof PrismaClient) => {
  const pinecone = await initPinecone();

  console.log('list indexes', await pinecone.listIndexes());

  if (!(await pinecone.listIndexes()).includes('embeds-test')) {
    console.log('creating index');
    await pinecone.createIndex({
      createRequest: {
        name: 'embeds-test',
        dimension: 1536,
      },
    });
  }
  const pineconeIndex = pinecone.Index('embeds-test');

  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex: pineconeIndex,
    namespace: NAME_SPACE,
  });

  const filePath = path.join(SHARED_DIR, 'notes.txt');
  const file = fs.readFileSync(filePath, 'utf-8');

  const docs: Document[] = [];

  file.split('\n').forEach((line) => {
    // remove all dashes that are not directly followed by a letter
    line = line.replace(/-(?![a-zA-Z])/g, '');
    line = line.replace(/^\s*[\r\n]/gm, ''); // TODO: not sure about this one
    line = line.trim();

    if (line.length === 0) {
      return;
    }

    const doc = new Document({
      metadata: { type: 'note' },
      pageContent: line,
    });

    docs.push(doc);
  });

  console.log('docs', docs);

  await vectorStore.addDocuments(docs);
  console.log('success!');
};
