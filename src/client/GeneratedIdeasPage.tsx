import './Main.css';
import { useEffect, useState, useContext, ChangeEvent, MouseEvent, useRef, ButtonHTMLAttributes } from 'react';
import AppContext from './Context';
import { useQuery } from '@wasp/queries';
import getTweetDraftsWithIdeas from '@wasp/queries/getTweetDraftsWithIdeas';
import generateTweet from '@wasp/actions/generateTweet';
import generateTweetDraftsAndIdeas from '@wasp/actions/generateTweetDraftsAndIdeas';
import sendTweet from '@wasp/actions/sendTweet';
import type { GeneratedIdea, User } from '@wasp/entities';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog } from '@headlessui/react';
import Accordion from './components/Accordion';
import { AiOutlineLoading, AiOutlineInfoCircle } from 'react-icons/ai';
import StyleWrapper from './components/StyleWrapper';
// import { TwitterTweetEmbed } from 'react-twitter-embed';
// import Skeleton from './components/Skeleton';

const twitterIcon: any = twitterSvg();

const GeneratedIdeasPage = ({ user }: { user: User }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [exampleTweet, setExampleTweet] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [showTooltip, setShowTooltip] =  useState(false);

  const { popoverButtonRef, setIdeaObject } = useContext(AppContext);

  const { data: tweetDrafts, isLoading: isTweetDraftsLoading } = useQuery(getTweetDraftsWithIdeas);

  useEffect(() => {
    const script = document.createElement('script');

    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGenerateTweetModal = (idea: string, example?: string) => {
    setModalContent(idea);
    if (example) setExampleTweet(example);
    setIsModalOpen((x) => !x);
  };

  const handleEmbedIdeaPopover = (idea: GeneratedIdea) => {
    popoverButtonRef.current?.click();
    setIdeaObject(idea);
  };

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
            {tweetDrafts.map((tweetDraft, index) => (
              <div
                key={index}
                id={String(tweetDraft.id)}
                className={`border border-neutral-500 bg-neutral-100 flex flex-col p-1 sm:p-4 text-neutral-700 rounded-xl text-left w-full`}
              >
                <div className='flex flex-col justify-center sm:flex-row sm:justify-evenly w-full'>
                  <div className='flex flex-col p-1'>
                    <h2 className='ml-1 mb-3 mt-1 font-bold'>Original Tweet</h2>
                    <div className='flex flex-row gap-4 items-start'>
                      <div className='w-[335px] -mt-3'>
                        <blockquote className='twitter-tweet'>
                          <p lang='en' dir='ltr'>
                            {tweetDraft.originalTweet?.content}
                          </p>
                          <a
                            href={`https://twitter.com/${tweetDraft.originalTweet.author.username}/status/${tweetDraft.originalTweet.tweetId}`}
                          >
                            {tweetDraft.originalTweet.tweetedAt.toDateString()}
                          </a>
                        </blockquote>{' '}
                        {/* <TwitterTweetEmbed tweetId={tweetDraft.originalTweet.tweetId} placeholder={<Skeleton />} /> */}
                      </div>
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

                  <div className='flex flex-row gap-1 p-1'>
                    <span className='text-neutral-600 font-slim italic'>{tweetDraft.notes}</span>
                    <Tippy content='Note has been embedded and saved to vector DB'>
                      <span>{'🧮'}</span>
                    </Tippy>
                  </div>
                </div>

                <div className='border-t border-neutral-200 bg-white/70 flex flex-row m-3 ' />
                <div className='flex flex-col w-full p-2 gap-3 items-start text-left'>
                  <div className='flex flex-row justify-start items-center'>
                    <h2 className='ml-1 font-bold'>Generated Ideas: </h2>
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
                    .map((idea, index) => (
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

export function twitterSvg() {
  return (
    <svg
      fill='#000000'
      height='22px'
      width='22px'
      version='1.1'
      id='Layer_1'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 310 310'
    >
      <g id='XMLID_826_'>
        <path
          id='XMLID_827_'
          d='M302.973,57.388c-4.87,2.16-9.877,3.983-14.993,5.463c6.057-6.85,10.675-14.91,13.494-23.73
		c0.632-1.977-0.023-4.141-1.648-5.434c-1.623-1.294-3.878-1.449-5.665-0.39c-10.865,6.444-22.587,11.075-34.878,13.783
		c-12.381-12.098-29.197-18.983-46.581-18.983c-36.695,0-66.549,29.853-66.549,66.547c0,2.89,0.183,5.764,0.545,8.598
		C101.163,99.244,58.83,76.863,29.76,41.204c-1.036-1.271-2.632-1.956-4.266-1.825c-1.635,0.128-3.104,1.05-3.93,2.467
		c-5.896,10.117-9.013,21.688-9.013,33.461c0,16.035,5.725,31.249,15.838,43.137c-3.075-1.065-6.059-2.396-8.907-3.977
		c-1.529-0.851-3.395-0.838-4.914,0.033c-1.52,0.871-2.473,2.473-2.513,4.224c-0.007,0.295-0.007,0.59-0.007,0.889
		c0,23.935,12.882,45.484,32.577,57.229c-1.692-0.169-3.383-0.414-5.063-0.735c-1.732-0.331-3.513,0.276-4.681,1.597
		c-1.17,1.32-1.557,3.16-1.018,4.84c7.29,22.76,26.059,39.501,48.749,44.605c-18.819,11.787-40.34,17.961-62.932,17.961
		c-4.714,0-9.455-0.277-14.095-0.826c-2.305-0.274-4.509,1.087-5.294,3.279c-0.785,2.193,0.047,4.638,2.008,5.895
		c29.023,18.609,62.582,28.445,97.047,28.445c67.754,0,110.139-31.95,133.764-58.753c29.46-33.421,46.356-77.658,46.356-121.367
		c0-1.826-0.028-3.67-0.084-5.508c11.623-8.757,21.63-19.355,29.773-31.536c1.237-1.85,1.103-4.295-0.33-5.998
		C307.394,57.037,305.009,56.486,302.973,57.388z'
        />
      </g>
    </svg>
  );
}

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

function DraftTweetWrapper({
  username,
  newTweet,
  sendTweet,
  id,
}: {
  username: string;
  newTweet: string;
  sendTweet: (tweetContent: string) => Promise<any>;
  id?: string;
}) {
  const [isTweetSending, setIsTweetSending] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendTweet = async (e: MouseEvent<HTMLButtonElement>) => {
    try {
      setIsTweetSending(true);
      // get tweet content from textarea ref
      if (!textAreaRef.current?.value) throw new Error('Tweet content is empty!');
      const tweetContent = textAreaRef.current?.value;
      console.log('new Tweet to send', tweetContent);
      const res = await sendTweet(tweetContent.trim());
      // console.log('res: ', res);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsTweetSending(false);
    }
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
    return () => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
      }
    };
  }, [textAreaRef.current]);

  return (
    <div
      key={newTweet}
      className={`flex flex-col text-left border bg-white/70 p-2 text-neutral-700 rounded-xl w-[335px]`}
    >
      <div className={`flex flex-row p-1 justify-between w-full`}>
        <div className='flex items-start'>
          <div className='border border-black bg-black/80 w-12 h-12 rounded-full' />
          <div className='flex flex-col mx-2'>
            <div className='text-sm font-bold text-neutral-900'>@{username}</div>
          </div>
        </div>
        <div className='flex flex-col'>{twitterIcon}</div>
      </div>
      <div className='flex flex-col mx-2'>
        {' '}
        <textarea
          id={String(id || 0)}
          className='border border-neutral-300 p-2 rounded-lg w-full text-neutral-700'
          ref={textAreaRef}
          // onChange={handleNewTweetChange}
          defaultValue={newTweet}
          style={{ height: textAreaRef.current?.scrollHeight + 'px' }}
        />
      </div>
      <div className='border-t border-neutral-500 bg-white/70 flex flex-row m-2 ' />
      <div className='flex flex-row p-1'>
        <div className='flex flex-col mx-2'>
          <div className='text-sm text-neutral-600'>{new Date().toDateString()}</div>
        </div>
      </div>

      <div className='flex flex-row justify-center gap-1 m-1'>
        <button
          className={`flex flex-row justify-center items-center bg-neutral-100 hover:bg-neutral-200 w-full border border-neutral-300 text-blue-500 font-bold m-1 px-3 py-1 text-sm rounded-2xl ${
            isTweetSending ? ' pointer-events-none opacity-70' : 'cursor-pointer'
          }`}
          onClick={handleSendTweet}
        >
          <AiOutlineLoading className={`animate-spin absolute ${isTweetSending ? 'block' : 'invisible'}`} />
          <span className={`${isTweetSending ? 'invisible' : 'block'}`}>Send Tweet</span>
        </button>
      </div>
    </div>
  );
}
