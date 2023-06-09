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

const twitterIcon: any = twitterSvg();

const GeneratedIdeasPage = ({ match, user }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const userId = match.params.userId;

  const { data: ideas, isLoading } = useQuery(getGeneratedIdeas);

  const { data: tweetDrafts, isLoading: isTweetDraftsLoading } = useQuery(getTweetDraftsWithIdeas);

  const handleModalOpen = (idea: string) => {
    setModalContent(idea);
    setIsModalOpen((x) => !x);
  };

  // useEffect(() => {
  //   if (!data) return;
  //   document.getElementById('highlighted')?.scrollIntoView({ behavior: 'smooth' });
  // }, [data]);

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
        <div className='flex flex-col sm:flex-row justify-center '>
          {isTweetDraftsLoading ? (
            'Loading...'
          ) : tweetDrafts?.length ? (
            <div className='border border-neutral-700 bg-neutral-100/40 rounded-lg p-1 sm:p-4 grid grid-rows-3 gap-4 w-full sm:w-2/4'>
              {tweetDrafts.length > 0 &&
                tweetDrafts.map((tweetDraft, index) => (
                  <div
                    key={index}
                    id={String(tweetDraft.id)}
                    className={`border border-neutral-500 bg-neutral-100 flex flex-col p-1 sm:p-4 text-neutral-700 rounded-lg w-4/4 text-left`}
                  >
                    <div className='flex flex-row p-2 gap-4 items-start'>
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
                      <div
                        key={index}
                        id={String(tweetDraft.id)}
                        className={`flex flex-col text-left border border-neutral-500 bg-white/70 p-2 text-neutral-700 rounded-lg w-[335px]`}
                      >
                        <div className={`flex flex-row p-1 justify-between w-full`}>
                          <div className='flex items-start'>
                            <div className='border border-black bg-black/80 w-12 h-12 rounded-full' />
                            <div className='flex flex-col mx-2'>
                              <div className='text-sm font-bold text-neutral-900'>@{user.username}</div>
                            </div>
                          </div>
                          <div className='flex flex-col'>{twitterIcon}</div>
                        </div>
                        <div className='flex flex-col mx-2'>{tweetDraft.content}</div>
                        <div className='border-t border-neutral-500 bg-white/70 flex flex-row m-2 ' />
                        <div className='flex flex-row p-1'>
                          <div className='flex flex-col mx-2'>
                            <div className='text-sm text-neutral-600'>{tweetDraft.createdAt.toDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='border-t border-neutral-300 bg-white/70 flex flex-row m-2 ' />

                    <div className='flex flex-row w-4/4 p-2 gap-2 text-left'>
                      <h2 className='ml-1 text-neutral-700 font-bold'>Based on your note: </h2>
                      <span className='text-neutral-600 font-slim italic'>{tweetDraft.notes}</span>
                    </div>
                    <div className='border-t border-neutral-300 bg-white/70 flex flex-row m-2 ' />

                    <div className='flex flex-col w-4/4 p-2 gap-2 items-start text-left'>
                      <h2 className='ml-1 font-bold'>New Generated Ideas: </h2>
                      {tweetDraft.originalTweet?.ideas.map((idea, index) => (
                        <div className='border bg-white/70 rounded-lg p-3'>
                          {/* <Tippy content='Hello'> */}
                          <li key={index} className='text-neutral-700'>
                            {idea.content}
                          </li>
                          <div className='flex flex-row justify-end'>
                            <button
                              onClick={() => handleModalOpen(idea.content)}
                              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
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
}: {
  idea: string;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  username: string;
}) {
  const [newTweet, setNewTweet] = useState('');
  const [prompt, setPrompt] = useState('');

  const sendTweet = async () => {
    const tweetContent = newTweet;
    console.log('tweetContent', tweetContent);
  };

  const handleGenerateTweet = async (e: any) => {
    e.preventDefault();
    const tweetFromIdea = await generateTweet({ idea, prompt });
    console.log('tweetFromIdea', tweetFromIdea.newTweetIdeas.trim());
    setNewTweet(tweetFromIdea.newTweetIdeas.trim());
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleNewTweetChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewTweet(e.target.value);
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
                <textarea
                  id='textInput'
                  onChange={handleChange}
                  // value={newTweet.length > 0 ? newTweet : ''}
                ></textarea>

                <button onClick={handleGenerateTweet}>Generate New Tweet Draft</button>
                {/* <button onClick={() => setIsModalOpen(false)}>Cancel</button> */}
                {newTweet.length > 0 && <button onClick={() => setIsModalOpen(false)}>Send Tweet</button>}
              </>
            ) : (
              <>
                <Dialog.Title>New Tweet Draft</Dialog.Title>
                <Dialog.Description>Based on: {idea}</Dialog.Description>
                <DraftTweetWrapper username={username} newTweet={newTweet} handleNewTweetChange={handleNewTweetChange} />
                <div className='flex flex-row justify-between gap-1 m-1'>
                  <button onClick={() => setIsModalOpen(false)}>Cancel</button>
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
}: {
  username: string;
  newTweet: string;
  handleNewTweetChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className={`flex flex-col text-left border border-neutral-500 bg-white/70 p-2 text-neutral-700 rounded-lg w-[335px]`}
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
          id='textInput'
          ref={textAreaRef}
          onChange={handleNewTweetChange}
          defaultValue={newTweet}
          value={newTweet.length > 0 ? newTweet : ''}
          style={{ height: textAreaRef.current?.scrollHeight }}
        />
      </div>
      <div className='border-t border-neutral-500 bg-white/70 flex flex-row m-2 ' />
      <div className='flex flex-row p-1'>
        <div className='flex flex-col mx-2'>
          <div className='text-sm text-neutral-600'>{new Date().toDateString()}</div>
        </div>
      </div>
    </div>
  );
}
