import './Main.css';
import {
  useState,
  useContext,
  lazy,
  Suspense,
  ChangeEvent,
  ButtonHTMLAttributes,
} from 'react';
import AppContext from './Context';
import { useQuery } from '@wasp/queries';
import getTweetDraftsWithIdeas from '@wasp/queries/getTweetDraftsWithIdeas';
import generateTweet from '@wasp/actions/generateTweet';
import generateTweetDraftsAndIdeas from '@wasp/actions/generateTweetDraftsAndIdeas';
import sendTweet from '@wasp/actions/sendTweet';
import { type User } from '@wasp/entities';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog } from '@headlessui/react';
import { AiOutlineLoading, AiOutlineInfoCircle } from 'react-icons/ai';
import StyleWrapper from './components/StyleWrapper';
import LazyLoadComponent from './components/LazyLoad';
import DraftTweetWrapper from './components/DraftTweetWrapper';
// import { TwitterTweetEmbed } from 'react-twitter-embed';
// import Skeleton from './components/Skeleton';

const LazyTweetDraftWithIdeas = lazy(() => import('./components/TweetDraft'));

const GeneratedIdeasPage = ({ user }: { user: User }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [exampleTweet, setExampleTweet] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { popoverButtonRef, setIdeaObject } = useContext(AppContext);

  const { data: tweetDrafts, isLoading: isTweetDraftsLoading } = useQuery(getTweetDraftsWithIdeas);

  const handleBrainstormAction = async () => {
    try {
      setIsBrainstorming(true);
      setTimeout(() => {
        setShowTooltip(true);
      }, 1000);
      await generateTweetDraftsAndIdeas();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBrainstorming(false);
      setShowTooltip(false);
    }
  };

  if (isTweetDraftsLoading) {
    return <span className='mx-auto w-full p-4 text-center'>Loading...</span>;
  }

  if (user.favUsers.length === 0 || (tweetDrafts?.length && tweetDrafts.length === 0)) {
    return (
      <span className='mx-auto w-full text-center'>
        <div className='py-7 flex flex-col sm:flex-row gap-1 justify-center items-center'>
          <span>⚠️ You must first add trend-setting twitter users to base generated ideas off of in </span>
          <a href='/settings' className='underline'>
            Settings
          </a>
        </div>
      </span>
    );
  }

  return (
    <StyleWrapper>
      <div className='flex flex-col sm:flex-row justify-center'>
        {tweetDrafts?.length ? (
          <div className='flex flex-col items-center justify-center gap-4 border border-neutral-700 bg-neutral-100/40 rounded-xl p-1 sm:p-4 w-full md:w-4/5 lg:w-3/4 xl:w-3/5 2xl:w-1/2 '>
            {tweetDrafts.map((tweetDraft) => (
              <LazyLoadComponent>
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyTweetDraftWithIdeas
                    key={tweetDraft.content}
                    tweetDraft={tweetDraft}
                    user={user}
                    sendTweet={sendTweet}
                    setModalContent={setModalContent}
                    setExampleTweet={setExampleTweet}
                    setIsModalOpen={setIsModalOpen}
                    popoverButtonRef={popoverButtonRef}
                    setIdeaObject={setIdeaObject}
                  />
                </Suspense>
              </LazyLoadComponent>
            ))}
          </div>
        ) : (
          <div className='border border-neutral-500 bg-neutral-100 flex flex-col p-1 sm:p-4 text-neutral-700 rounded-xl text-left'>
            <div className='p-2 flex flex-col sm:flex-row gap-1 justify-center items-center w-full'>
              <span>⚠️ Nothing has been brainstormed for you yet!</span>
              <span>Remember to add some notes to improve the ideas that will be generated for you.</span>
            </div>
            <Tippy
              delay={500}
              visible={showTooltip}
              placement='bottom'
              content='Brainstorming new ideas can take a few minutes. Please be patient.'
            >
              <div className='flex flex-row justify-center items-center m-5'>
                <PillButton textColor='text-neutral-500' onClick={handleBrainstormAction} isLoading={isBrainstorming}>
                  🧠 Brainstorm New Tweet Drafts & Ideas
                </PillButton>
              </div>
            </Tippy>
          </div>
        )}
      </div>
      <EditModal
        idea={modalContent}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        username={user.username}
        exampleTweet={exampleTweet}
      />
    </StyleWrapper>
  );
};
export default GeneratedIdeasPage;

export function EditModal({
  idea,
  isModalOpen,
  setIsModalOpen,
  username,
  exampleTweet,
  setExampleTweet,
}: {
  idea: string;
  isModalOpen: boolean;
  username: string;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  exampleTweet?: string;
  setExampleTweet?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [newTweet, setNewTweet] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isUserTweetStyle, setIsUserTweetStyle] = useState(false);
  const [userTweetStyle, setUserTweetStyle] = useState('');
  const [isTweetGenerating, setIsTweetGenerating] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleGenerateTweet = async (e: any) => {
    try {
      setIsTweetGenerating(true);
      console.log('exampleTweet', exampleTweet);

      if (!exampleTweet || exampleTweet.length == 0) return;

      let tweetFromIdea;
      if (isUserTweetStyle && userTweetStyle.length > 0) {
        tweetFromIdea = await generateTweet({ idea, prompt, exampleTweet, proposedStyle: userTweetStyle });
      } else {
        tweetFromIdea = await generateTweet({ idea, prompt, exampleTweet });
      }

      setNewTweet(tweetFromIdea.newTweet.trim());
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsTweetGenerating(false);
    }
  };

  const handleDiscardTweet = async (e: any) => {
    e.preventDefault();
    setNewTweet('');
    setIsModalOpen(false);
    if (setExampleTweet) setExampleTweet('');
  };

  const handleCheckboxChange = (e: any) => {
    if (e.target.checked) {
      setIsUserTweetStyle(true);
    } else {
      setIsUserTweetStyle(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className='relative z-50'>
      <div className='fixed inset-0 bg-black/30' aria-hidden='true' />
      <div className='fixed inset-0 flex items-center justify-center p-4 overflow-hidden'>
        <div className='bg-neutral-100 border border-neutral-500 rounded-lg w-full sm:w-[400px] flex flex-col items-center justify-center'>
          <Dialog.Panel className='w-full h-full p-7'>
            {newTweet.length === 0 ? (
              <>
                <div className='flex flex-col gap-1 mx-1 mt-4'>
                  <Dialog.Title className='text-neutral-700 font-bold'>Generate New Tweet From Idea:</Dialog.Title>
                  <Dialog.Description className='mb-4 '>{idea}</Dialog.Description>
                  <div className='flex flex-row justify-start items-center'>
                    <h2 className='font-bold'>Prompt: </h2>
                    <Tippy placement={'top'} content='Give GPT extra instructions on how to create your tweet draft.'>
                      <span className='ml-1'>
                        <AiOutlineInfoCircle />
                      </span>
                    </Tippy>
                  </div>
                  <textarea
                    id='textInput'
                    placeholder='Write a thought-provoking tweet ...'
                    className='w-full p-2'
                    onChange={handleChange}
                  ></textarea>

                  <div className='flex flex-row justify-start items-center my-2'>
                    <input
                      type='checkbox'
                      id='propseTweetStyle'
                      onChange={handleCheckboxChange}
                      defaultChecked={isUserTweetStyle}
                    />
                    <h2 className='ml-1 font-bold'>Custom Tweet Style? </h2>
                    <Tippy placement={'top'} content='Define a style the tweet should be written in.'>
                      <span className='ml-1'>
                        <AiOutlineInfoCircle />
                      </span>
                    </Tippy>
                  </div>

                  {isUserTweetStyle && (
                    <textarea
                      id='userTweetStyle'
                      placeholder='An informal yet serious tone. Simple vocabulary and punctuation ...'
                      className='w-full p-4'
                      onChange={(e) => setUserTweetStyle(e.target.value)}
                    />
                  )}

                  <div className='flex flex-row justify-between gap-1 mx-1 mt-4'>
                    <PillButton textColor='text-neutral-500' onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </PillButton>
                    <PillButton onClick={handleGenerateTweet} isLoading={isTweetGenerating}>
                      Generate New Tweet Draft
                    </PillButton>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className='flex flex-col gap-1 mx-1 mt-4'>
                  <Dialog.Title className='text-neutral-700 font-bold'>New Tweet Draft</Dialog.Title>
                  {/* <Dialog.Description>Based on: {idea}</Dialog.Description> */}
                  <DraftTweetWrapper username={username} newTweet={newTweet} sendTweet={sendTweet} />

                  <div className='flex flex-row justify-between gap-1 mx-1 mt-4'>
                    <PillButton textColor='text-neutral-500' onClick={handleDiscardTweet}>
                      Discard Tweet
                    </PillButton>
                    {/* <PillButton onClick={handleSendTweet} isLoading={isTweetSending}>
                      Send Tweet
                    </PillButton> */}
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  textColor?: string;
  isLoading?: boolean;
}

export function PillButton({ textColor, isLoading, children, ...otherProps }: PillButtonProps) {
  return (
    <button
      {...otherProps}
      className={`flex flex-row justify-center items-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 ${
        textColor ? textColor : 'text-blue-500'
      } font-bold whitespace-nowrap px-3 py-1 text-sm rounded-lg ${
        isLoading ? ' pointer-events-none opacity-70' : 'cursor-pointer'
      }`}
    >
      <AiOutlineLoading className={`animate-spin absolute ${isLoading ? 'block' : 'invisible'}`} />
      <span className={`${isLoading ? 'invisible' : 'flex flex-row'}`}>{children}</span>
    </button>
  );
}
