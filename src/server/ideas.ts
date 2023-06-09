import type { EmbedIdeas } from '@wasp/actions/types';
import type { GetGeneratedIdeas } from '@wasp/queries/types';
import type { GeneratedIdea } from '@wasp/entities';
import HttpError from '@wasp/core/HttpError.js';
import { initPinecone, embeddings } from './utils.js';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';

export const embedIdeas: EmbedIdeas<number[], void> = async (ids, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  try {
    const ideas: GeneratedIdea[] = [];
    ids.forEach(async (id) => {
      const idea = await context.entities.GeneratedIdea.findUnique({
        where: {
          id: id,
        },
      });

      if (!idea) {
        throw new HttpError(404, 'Idea not found');
      }

      if (idea.userId !== context.user?.id) {
        throw new HttpError(401, 'User is not authorized');
      }

      ideas.push(idea);
    });

    const pinecone = await initPinecone();

    const pineconeIndex = pinecone.Index('embeds-test');

    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: context.user.username,
    });

    const docs = ideas.map((idea) => {
      return new Document({
        metadata: { type: 'note' },
        pageContent: idea.content,
      });
    });

    await vectorStore.addDocuments(docs);
    console.log('idea embedded successfully!');
  } catch (error) {
    console.log('error embedding idea: ', error);
  }
};

export const getGeneratedIdeas: GetGeneratedIdeas<unknown, GeneratedIdea[]> = async (_args, context) => { 
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const ideas = await context.entities.GeneratedIdea.findMany({
    where: {
      userId: context.user.id,
    },
  });

  return ideas;
}