import type { EmbedIdea, EmbedIdeas, UpdateIdea, DeleteIdea } from '@wasp/actions/types';
import type { GetEmbeddedIdeas, FetchSimilarNotes } from '@wasp/queries/types';
import type { GeneratedIdea } from '@wasp/entities';
import HttpError from '@wasp/core/HttpError.js';
import { initPinecone, embeddings } from './utils.js';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';
import { openai } from './utils.js';

type EmbedIdeaArgs = {
  idea: string;
  id?: number;
  originalTweetId?: number;
};

/**
 * Embeds a single idea into the vector store
 */
export const embedIdea: EmbedIdea<EmbedIdeaArgs, GeneratedIdea> = async ({ id, idea, originalTweetId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  console.log('idea: ', idea);

  try {
    let newIdea;

    if (id && originalTweetId) {
      newIdea = await context.entities.GeneratedIdea.update({
        where: {
          id: id,
        },
        data: {
          content: idea,
          originalTweetId,
          updatedAt: new Date(),
        },
      });
    } else {
      newIdea = await context.entities.GeneratedIdea.create({
        data: {
          content: idea,
          userId: context.user.id,
        },
      });
    }

    if (!newIdea) {
      throw new HttpError(404, 'Idea not found');
    }

    const pinecone = await initPinecone();

    const pineconeIndex = pinecone.Index('embeds-test');

    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: context.user.username,
    });

    const ideaDoc = new Document({
      metadata: { type: 'note' },
      pageContent: newIdea.content,
    });

    await vectorStore.addDocuments([ideaDoc], [newIdea.id.toString()]);

    newIdea = await context.entities.GeneratedIdea.update({
      where: {
        id: newIdea.id,
      },
      data: {
        isEmbedded: true,
      },
    });
    console.log('idea embedded successfully! /././././././.', newIdea);
    return newIdea;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const updateIdea: UpdateIdea<{ id: number; content: string }, GeneratedIdea> = async (
  { id, content },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  try {
    let updatedIdea = await context.entities.GeneratedIdea.findUnique({
      where: {
        id: id,
      },
    });

    if (!updatedIdea) {
      throw new HttpError(404, 'Idea not found');
    }

    const pineconeClient = await initPinecone();

    const pineconeIndex = pineconeClient.Index('embeds-test');

    // pineconeIndex.update()

    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: context.user.username,
    });

    const ideaDoc = new Document({
      metadata: { type: 'note' },
      pageContent: content,
    });

    await vectorStore.addDocuments([ideaDoc], [updatedIdea.id.toString()]);

    updatedIdea = await context.entities.GeneratedIdea.update({
      where: {
        id: id,
      },
      data: {
        content: content,
        updatedAt: new Date(),
      },
    });

    console.log('idea embedded successfully! /././././././.', updatedIdea);

    return updatedIdea;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const deleteIdea: DeleteIdea<number, void> = async (id, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  try {
    let deletedIdea = await context.entities.GeneratedIdea.findUnique({
      where: {
        id: id,
      },
    });

    if (!deletedIdea) {
      throw new HttpError(404, 'Idea not found');
    }

    const pineconeClient = await initPinecone();

    const pineconeIndex = pineconeClient.Index('embeds-test');

    const requestParams = {
      ids: [deletedIdea.id.toString()],
      namespace: context.user.username,
    };

    // const res = await pineconeIndex.fetch(requestParams);
    // console.log('vector exists in DB: ', res)

    await pineconeIndex.delete1(requestParams); // returns an empty object on success or throws an error

    deletedIdea = await context.entities.GeneratedIdea.delete({
      where: {
        id: id,
      },
    });

    console.log('idea deleted from vector store & DB: ', deletedIdea.id);
  } catch (error: any) {
    throw new Error(error);
  }
};

export const fetchSimilarNotes: FetchSimilarNotes<{ query: string }, GeneratedIdea[] | null> = async (
  { query },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  try {
    const pineconeClient = await initPinecone();

    const pineconeIndex = pineconeClient.Index('embeds-test');

    const searchRes = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query.trim(),
    });

    // get the embedding of the search query
    const embedding = searchRes.data.data[0].embedding;

    // find the top 5 closest embeddings to the search query
    const queryRequest = {
      vector: embedding,
      topK: 5,
      includeValues: true,
      includeMetadata: true,
      namespace: context.user.username,
    };
    const queryResponse = await pineconeIndex.query({ queryRequest });

    console.log('queryResponse: ', queryResponse.matches?.map((match) => match.metadata))

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      const matchingIdeas = queryResponse.matches
        .filter((match) => match.score && match.score > 0.7)
        .map(async (match) => {
          const id = Number(match.id);
          console.log('id: ', id);
          console.log('isNaN(id): ', isNaN(id));
          // check if Number(match.id) is NaN
          if (isNaN(id)) return null;
          return await context.entities.GeneratedIdea.findUnique({
            where: {
              id: Number(match.id),
            },
          });
        });

      const res = await Promise.all(matchingIdeas);
      const filteredIdeas = res.filter((idea) => idea) as GeneratedIdea[];
      return filteredIdeas;
    } else {
      return null;
    }
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getEmbeddedIdeas: GetEmbeddedIdeas<unknown, GeneratedIdea[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const ideas = await context.entities.GeneratedIdea.findMany({
    where: {
      userId: context.user.id,
      isEmbedded: true,
    },
  });

  return ideas;
};

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
