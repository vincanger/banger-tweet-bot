import waspLogo from './waspLogo.png';
import { useEffect, useState, ChangeEvent, MouseEvent, useRef } from 'react';
import { useQuery } from '@wasp/queries';
import getGeneratedIdeas from '@wasp/queries/getGeneratedIdeas';
import getTweetDraftsWithIdeas from '@wasp/queries/getTweetDraftsWithIdeas';
import generateTweet from '@wasp/actions/generateTweet';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog } from '@headlessui/react';
import { Menu } from '@headlessui/react';
import { Popover } from '@headlessui/react';

const twitterIcon: any = twitterSvg();

const GeneratedIdeasPage = ({ match, user }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [exampleTweet, setExampleTweet] = useState('');
  const [editedTweet, setEditedTweet] = useState('');

  const userId = match.params.userId;

  // const handleDraftTweetChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
  //   setEditedTweet(e.target.value);
  // };

  const sendTweet = async (id: string) => {
    const editedTweet = document.getElementById(id)?.getElementsByTagName('textarea')[0].value;
    console.log('editedTweet >>>>>>>', editedTweet);
    // TODO: add send tweet logic
  };

  const handleMouseOver = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      console.log('mouse over');
      el.style.visibility = 'visible';
    }
  };

  const handleMouseOut = (id: string) => {
    const el = document.getElementById(id);
    console.log('mouse over');
    if (el) {
      el.style.visibility = 'hidden';
    }
  };

  const { data: ideas, isLoading } = useQuery(getGeneratedIdeas);

  const { data: tweetDrafts, isLoading: isTweetDraftsLoading } = useQuery(getTweetDraftsWithIdeas);

  const handleModalOpen = (idea: string, example?: string) => {
    setModalContent(idea);
    if (example) setExampleTweet(example);
    setIsModalOpen((x) => !x);
  };

  return (
    <div className='min-h-screen bg-neutral-300/70 text-center'>
      <div className='sm:inline-block mx-auto'>
        <div className='py-7 flex flex-col items-center'>
          <div className='flex pb-7 justify-center items-center'>
            <img src={waspLogo} className='h-6 mr-2 ' alt='wasp' />
            <h1 className='text-xl ml-1'>Generated Ideas!</h1>
          </div>
          <div className='flex pb-4 pt-2 items-center justify-evenly w-3/5'>
            <div className='w-2/6 border-t border-neutral-700'></div>
            <span className='text-neutral-700 text-center'>✨ 🐝 ✨</span>
            <div className='w-2/6 border-t border-neutral-700'></div>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row justify-center'>
          {isTweetDraftsLoading ? (
            'Loading...'
          ) : tweetDrafts?.length ? (
            <div className='flex flex-col items-center justify-center gap-4 border border-neutral-700 bg-neutral-100/40 rounded-lg p-1 sm:p-4 w-full md:w-4/5 lg:w-3/4 xl:w-3/5 2xl:w-1/2 '>
              {tweetDrafts.length > 0 &&
                tweetDrafts.map((tweetDraft, index) => (
                  <div
                    key={index}
                    id={String(tweetDraft.id)}
                    className={`border border-neutral-500 bg-neutral-100 flex flex-col p-1 sm:p-4 text-neutral-700 rounded-lg text-left`}
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
                                June 8, 2023
                              </a>
                            </blockquote>{' '}
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-col p-1'>
                        <h2 className='ml-1 mb-3 mt-1 font-bold'>Tweet Draft Based on Original & Notes</h2>
                        <DraftTweetWrapper
                          username={user.username}
                          newTweet={tweetDraft.content}
                          // handleNewTweetChange={handleDraftTweetChange}
                          sendTweet={sendTweet}
                          id={String(tweetDraft.id)}
                        />
                      </div>
                    </div>

                    <div className='border-t border-neutral-200 bg-white/70 flex flex-row m-3 ' />

                    <div className='flex flex-col w-4/4 p-2 gap-2 items-start text-left'>
                      <h2 className='ml-1 font-bold'>Your most similar note: </h2>
                      {/* <div className='border bg-white/30 rounded-lg p-3 w-full'> */}
                      <span className='text-neutral-600 font-slim italic'>{tweetDraft.notes}</span>
                      {/* </div> */}
                    </div>

                    <div className='border-t border-neutral-200 bg-white/70 flex flex-row m-3 ' />
                    <div className='flex flex-col w-full p-2 gap-2 items-start text-left'>
                      <h2 className='ml-1 font-bold'>New Generated Ideas Based on the Original Tweet and Note: </h2>
                      {tweetDraft.originalTweet?.ideas.map((idea, index) => (
                        <div
                          onMouseOver={() => handleMouseOver(String(idea.id))}
                          onMouseOut={() => handleMouseOut(String(idea.id))}
                          className='border bg-white/30 rounded-lg p-3 w-full'
                        >
                          {/* <Tippy content='Hello'> */}
                          <li key={index} className='text-neutral-700'>
                            {idea.content}
                          </li>
                          <div
                            id={String(idea.id)}
                            className='flex flex-row justify-end gap-0'
                            style={{ visibility: 'hidden' }}
                          >
                            <OptionsPopover />
                            <button
                              onClick={() => handleModalOpen(idea.content)}
                              className='bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-blue-500 font-bold px-3 py-1 text-sm rounded-l-2xl'
                            >
                              Add Idea to Notes
                            </button>
                            <button
                              onClick={() => handleModalOpen(idea.content, tweetDraft.originalTweet.content)}
                              className='bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-blue-500 font-bold px-3 py-1 text-sm -ml-px rounded-r-2xl'
                            >
                              Generate Tweet From Idea
                            </button>
                          </div>
                          {/* </Tippy> */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            'your ideas will appear here once they are generated!'
          )}
        </div>
      </div>
      <EditModal
        idea={modalContent}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        username={user.username}
        exampleTweet={exampleTweet}
      />
    </div>
  );
};
export default GeneratedIdeasPage;

function twitterSvg() {
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

function EditModal({
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

  const handleNewTweetChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewTweet(e.target.value);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const sendTweet = async () => {
    const tweetContent = newTweet;
    console.log('tweetContent', tweetContent);
    // TODO: add send tweet logic
  };

  const handleGenerateTweet = async (e: any) => {
    e.preventDefault();
    console.log('exampleTweet', exampleTweet);
    if (!exampleTweet || exampleTweet.length == 0) return;
    let tweetFromIdea; 
    if(isUserTweetStyle && userTweetStyle.length > 0) {
      tweetFromIdea = await generateTweet({ idea, prompt, exampleTweet, proposedStyle: userTweetStyle });
    } else {
      tweetFromIdea = await generateTweet({ idea, prompt, exampleTweet });
    }
    
    setNewTweet(tweetFromIdea.newTweet.trim());
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
                <Dialog.Title>Idea:</Dialog.Title>
                <Dialog.Description>{idea}</Dialog.Description>
                <textarea id='textInput' onChange={handleChange}></textarea>

                <input
                  type='checkbox'
                  id='propseTweetStyle'
                  onChange={handleCheckboxChange}
                  defaultChecked={isUserTweetStyle}
                />
                <label htmlFor='propseTweetStyle'>Propose Tweet Style</label>

                {isUserTweetStyle && (
                  <textarea id='userTweetStyle' onChange={(e) => setUserTweetStyle(e.target.value)} />
                )}

                <button onClick={handleGenerateTweet}>Generate New Tweet Draft</button>
                <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              </>
            ) : (
              <>
                <Dialog.Title>New Tweet Draft</Dialog.Title>
                <Dialog.Description>Based on: {idea}</Dialog.Description>
                <DraftTweetWrapper
                  username={username}
                  newTweet={newTweet}
                  handleNewTweetChange={handleNewTweetChange}
                />
                <div className='flex flex-row justify-between gap-1 m-1'>
                  <button onClick={handleDiscardTweet}>Discard Tweet</button>
                  <button onClick={sendTweet}>Send Tweet</button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}

function MyDropdown() {
  return (
    <Menu>
      <Menu.Button>More</Menu.Button>
      <Menu.Items>
        <Menu.Item>
          {({ active }) => (
            <a className={`${active && 'bg-blue-500'}`} href='/account-settings'>
              Account settings
            </a>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <a className={`${active && 'bg-blue-500'}`} href='/account-settings'>
              Documentation
            </a>
          )}
        </Menu.Item>
        <Menu.Item disabled>
          <span className='opacity-75'>Invite a friend (coming soon!)</span>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

function DraftTweetWrapper({
  username,
  newTweet,
  handleNewTweetChange,
  id,
  sendTweet,
}: {
  username: string;
  newTweet: string;
  handleNewTweetChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  id?: string;
  sendTweet?: (id: string) => void;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
  }, [textAreaRef.current]);

  return (
    <div
      key={newTweet}
      className={`flex flex-col text-left border bg-white/70 p-2 text-neutral-700 rounded-lg w-[335px]`}
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
          onChange={handleNewTweetChange}
          defaultValue={newTweet}
          style={{ height: textAreaRef.current?.scrollHeight }}
        />
      </div>
      <div className='border-t border-neutral-500 bg-white/70 flex flex-row m-2 ' />
      <div className='flex flex-row p-1'>
        <div className='flex flex-col mx-2'>
          <div className='text-sm text-neutral-600'>{new Date().toDateString()}</div>
        </div>
      </div>
      {sendTweet && id && (
        <div className='flex flex-row justify-end gap-1 m-1'>
          <button onClick={() => sendTweet(id)}>Send Tweet</button>
        </div>
      )}
    </div>
  );
}

function OptionsPopover() {
  return (
    <Popover className='relative'>
      <Popover.Button>Solutions</Popover.Button>

      <Popover.Panel className='absolute z-10'>
        <div className='grid grid-cols-2'>
          <a href='/analytics'>Analytics</a>
          <a href='/engagement'>Engagement</a>
          <a href='/security'>Security</a>
          <a href='/integrations'>Integrations</a>
        </div>

        <img src='/solutions.jpg' alt='' />
      </Popover.Panel>
    </Popover>
  );
}
