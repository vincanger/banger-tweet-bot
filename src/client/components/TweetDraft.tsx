import { User, GeneratedIdea } from '@wasp/entities';
import Tippy from '@tippyjs/react';
import { useEffect, lazy, Suspense } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import Accordion from './Accordion';
import DraftTweetWrapper from './DraftTweetWrapper';
import TweetEmbedWrapper from './TweetEmbedWrapper';
import LazyLoadComponent from './LazyLoad';

const LazyTweetEmbed = lazy(() => import('./TweetEmbedWrapper'));

export type TweetDraftWithIdeas = {
  id: number;
  content: string;
  notes: string;
  createdAt: Date;
  originalTweet: {
    id: number;
    content: string;
    tweetId: string;
    tweetedAt: Date;
    ideas: GeneratedIdea[];
    author: {
      username: string;
      displayName: string;
      profilePic: string;
    };
  };
};

export default function TweetDraftWithIdeas({
  tweetDraft,
  user,
  sendTweet,
  setModalContent,
  setExampleTweet,
  setIsModalOpen,
  popoverButtonRef,
  setIdeaObject,
}: {
  tweetDraft: TweetDraftWithIdeas;
  user: User;
  sendTweet: (tweetContent: string) => Promise<any>;
  setModalContent: React.Dispatch<React.SetStateAction<string>>;
  setExampleTweet: React.Dispatch<React.SetStateAction<string>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  popoverButtonRef: React.MutableRefObject<HTMLButtonElement | null>;
  setIdeaObject: (idea: any) => void;
}) {
  const handleGenerateTweetModal = (idea: string, example?: string) => {
    setModalContent(idea);
    if (example) setExampleTweet(example);
    setIsModalOpen((x) => !x);
  };

  const handleEmbedIdeaPopover = (idea: GeneratedIdea) => {
    popoverButtonRef.current?.click();
    setIdeaObject(idea);
  };

  return (
    <div
      key={tweetDraft.content}
      id={String(tweetDraft.id)}
      className={`border border-neutral-500 bg-neutral-100 flex flex-col p-1 sm:p-4 text-neutral-700 rounded-xl text-left w-full`}
    >
      <div className='flex flex-col justify-center lg:flex-row lg:justify-evenly w-full'>
        <div className='flex flex-col p-1'>
          <h2 className='ml-1 mb-3 mt-1 font-bold'>Original Tweet</h2>
          <div className='flex flex-row gap-4 items-start'>
            <LazyLoadComponent>
              <Suspense fallback={<div>Loading...</div>}></Suspense>
              <TweetEmbedWrapper tweetDraft={tweetDraft} />
            </LazyLoadComponent>
          </div>
        </div>
        <div className='flex flex-col p-1'>
          <div className='flex mb-3 mt-1 flex-row justify-start items-center'>
            <h2 className='ml-1 font-bold'>Draft Tweet based on Original & Ideas </h2>
            <Tippy
              placement={'top'}
              content='Based on the original tweet, GPT finds your most similar notes, generates a list of new ideas (below), and drafts an example tweet.'
            >
              <span className='ml-1'>
                <AiOutlineInfoCircle />
              </span>
            </Tippy>
          </div>
          <DraftTweetWrapper
            username={user.username}
            newTweet={tweetDraft.content}
            sendTweet={sendTweet}
            id={String(tweetDraft.id)}
          />
        </div>
      </div>

      <div className='border-t border-neutral-200 bg-white/70 flex flex-row m-3 ' />

      <div className='flex flex-col w-4/4 p-2 gap-2 items-start text-left'>
        <div className='flex flex-row justify-start items-center'>
          <h2 className='ml-1 font-bold'>Your Most Similar Note(s): </h2>

          <Tippy
            placement={'top'}
            content='These are the notes you have added that are the most similar to the original tweet.'
          >
            <span className='ml-1'>
              <AiOutlineInfoCircle />
            </span>
          </Tippy>
        </div>

        {tweetDraft.notes.length > 1 && (
          <div className='flex flex-row gap-1 p-1'>
            <span className='text-neutral-600 font-slim italic'>{tweetDraft.notes}</span>
            <Tippy content='Note has been embedded and saved to vector DB'>
              <span>{'🧮'}</span>
            </Tippy>
          </div>
        )}
      </div>

      <div className='border-t border-neutral-200 bg-white/70 flex flex-row m-3 ' />
      <div className='flex flex-col w-full p-2 gap-3 items-start text-left'>
        <div className='flex flex-row justify-start items-center'>
          <h2 className='ml-1 font-bold'>Brainstormed Ideas: </h2>
          <Tippy
            placement={'top'}
            content='GPT has brainstormed these ideas for you based on your most similar note(s) above and the original tweet.'
          >
            <span className='ml-1'>
              <AiOutlineInfoCircle />
            </span>
          </Tippy>
        </div>
        {tweetDraft.originalTweet?.ideas
          .map((idea: any, index: any) => (
            <Accordion
              idea={idea}
              key={idea.updatedAt.getTime() + index}
              originalTweetContent={tweetDraft.originalTweet.content}
              handleEmbedIdeaPopover={handleEmbedIdeaPopover}
              handleGenerateTweetModal={handleGenerateTweetModal}
            />
          ))
          .sort((a, b) => Number(b.key) - Number(a.key))}
      </div>
    </div>
  );
}
