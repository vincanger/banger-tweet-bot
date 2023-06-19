import { MdOutlineAutoAwesome } from 'react-icons/md';
import { HiChevronDown } from 'react-icons/hi';
import { BsFillPersonVcardFill } from 'react-icons/bs';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { Popover } from '@headlessui/react';
import useAuth from '@wasp/auth/useAuth';
import { useEffect, useContext, useRef, useState } from 'react';
import embedIdea from '@wasp/actions/embedIdea';
import AppContext from '../Context';
import { PillButton } from '../GeneratedIdeasPage';
import Tippy from '@tippyjs/react';

const active = 'inline-flex items-center border-b-2 border-indigo-400 px-1 pt-1 text-sm font-medium text-blue-600';
const inactive =
  'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-neutral-600 hover:border-neutral-800 hover:text-neutral-800';
const current = window.location.pathname;

export default function NavBar() {
  const { data: user } = useAuth();

  return (
    <nav className='bg-neutral-200 shadow-md sticky top-0 z-50 border-b border-neutral-600 w-full'>
      <div className='w-full mx-auto px-4 sm:px-12 lg:w-3/5'>
        <div className='flex h-16 justify-center'>
          <div className='flex justify-between w-full'>
            <div className='flex text-neutral-800'>
              <div className='flex sm:space-x-8'>
                <a href='/' className={current.includes('ideas') ? active : inactive}>
                  <MdOutlineAutoAwesome className='h-6 w-6 mr-2' />
                  <span className='hidden sm:block'>Tweets & Ideas</span>
                </a>
              </div>
            </div>
            <div className='w-1/3'></div>
            <div className='ml-6 flex justify-between space-x-2'>
              <a href={!!user ? '/settings' : '/login'} className={current === '/settings' ? active : inactive}>
                <BsFillPersonVcardFill className='h-6 w-6 mr-2' />
                <span className='hidden sm:block'>Settings</span>
              </a>
            </div>
          </div>
          <div className='absolute top-0 h-16 flex flex-row justify-center items-center'>
            <EmbedNotePopover />
          </div>
        </div>
      </div>
    </nav>
  );
}

function EmbedNotePopover() {
  const { popoverButtonRef, editedIdea, setEditedIdea, ideaObject, setIdeaObject } = useContext(AppContext);

  const [isIdeaEmbedding, setIsIdeaEmbedding] = useState(false);
  const [isIdeaSaved, setIsIdeaSaved] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ideaObject?.content) {
      setEditedIdea(ideaObject.content);
    }
  }, [ideaObject]);

  useEffect(() => {
    console.log('ideaObject from popover', ideaObject);
  }, [ideaObject]);

  const handleEmbedIdea = async (e: any) => {
    try {
      setIsIdeaEmbedding(true);
      if (!editedIdea) {
        throw new Error('Idea cannot be empty');
      }
      let embedIdeaResponse;
      if (!ideaObject) {
        embedIdeaResponse = await embedIdea({
          idea: editedIdea!,
        });
      } else {
        embedIdeaResponse = await embedIdea({
          id: ideaObject.id,
          idea: editedIdea!,
          originalTweetId: ideaObject.originalTweetId || undefined,
        });
      }
      console.log('embedIdeaResponse @@@@@@@@<<<<<<<<>>>>>>@@@@@@@@@ ', embedIdeaResponse);
      if (embedIdeaResponse) {
        setIsIdeaSaved(true);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setEditedIdea('');
      setIdeaObject(null);
      setIsIdeaEmbedding(false);
      setTimeout(() => {
        setIsIdeaSaved(false);
      }, 2000);
    }
  };

  return (
    <div className='top-16 w-full max-w-sm px-4'>
      <Popover className='relative flex h-16 items-center'>
        {({ open }) => (
          <>
            <Popover.Button
              ref={popoverButtonRef}
              onClick={() => setIdeaObject(null)}
              className={`flex flex-row justify-center items-center hover:bg-blue-500 hover:text-white border border-blue-500 border-2 font-bold px-3 py-1 text-sm rounded-2xl ${
                open ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-blue-500'
              }`}
            >
              Add Note
              <HiChevronDown className='h-5 w-5 ml-1' />
            </Popover.Button>

            <Popover.Panel className='absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 translate-y-2/3 transform shadow-xl px-4 sm:px-0 lg:max-w-3xl'>
              {({ close }) => (
                <div className='overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5'>
                  <div className='relative grid gap-3 bg-white p-7'>
                    <div className='flex flex-row justify-start items-center'>
                      <h2 className='ml-1 font-bold'>Add Notes & Ideas to Your Vector Database </h2>
                      <Tippy
                        placement={'top'}
                        content='Adding notes to your vector DB is what allows GPT to generate ideas that are relevant to you.'
                      >
                        <span className='ml-1'>
                          <AiOutlineInfoCircle />
                        </span>
                      </Tippy>
                    </div>
                    <textarea
                      autoFocus
                      ref={textAreaRef}
                      onChange={(e) => setEditedIdea(e.target.value)}
                      defaultValue={ideaObject?.content}
                      className='w-full p-4 h-32 bg-neutral-100 border rounded-lg w-full'
                    />
                  </div>
                  <div className='bg-gray-50 p-4'>
                    <div className='flex flex-row justify-between gap-1 mx-1 mt-2'>
                      <PillButton
                        onClick={() => {
                          setEditedIdea('');
                          setIdeaObject(null);
                          close();
                        }}
                        textColor={'text-neutral-500'}
                      >
                        Discard Idea
                      </PillButton>

                      <PillButton onClick={handleEmbedIdea} isLoading={isIdeaEmbedding}>
                        <Tippy content='Note Added!' visible={isIdeaSaved} onClickOutside={() => setIsIdeaSaved(false)}>
                          <span>Embed & Save Idea</span>
                        </Tippy>
                      </PillButton>
                    </div>
                  </div>
                </div>
              )}
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  );
}
