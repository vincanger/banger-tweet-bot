import { Disclosure } from '@headlessui/react';
import { HiChevronUp, HiOutlineDocumentAdd, HiOutlineTrash } from 'react-icons/hi';
import { AiOutlineTwitter } from 'react-icons/ai';
import type { GeneratedIdea } from '@wasp/entities';
import Tippy from '@tippyjs/react';

export default function Accordion({
  idea,
  originalTweetContent,
  handleEmbedIdeaPopover,
  handleGenerateTweetModal,
  deleteIdea,
  isUpdate
}: {
  idea: GeneratedIdea;
  originalTweetContent?: string;
  handleEmbedIdeaPopover: (idea: GeneratedIdea) => void;
  handleGenerateTweetModal: (idea: string, originalTweet?: string) => void;
  deleteIdea?: (args: number) => Promise<void>;
  isUpdate?: boolean;
}) {
  return (
    <div className='w-full border border-neutral-300 rounded-xl'>
      <div className='w-full rounded-xl bg-white p-2'>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className='flex justify-between gap-1 w-full rounded-xl  px-4 py-2 text-left text-md font-medium text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring focus-visible:ring-yellow-500 focus-visible:ring-opacity-75'>
                <span className='w-[96%]'>{idea.content}</span>
                {idea.isEmbedded && (
                  <Tippy content='Note has been embedded and saved to vector DB'>
                    <span>{'🧮'}</span>
                  </Tippy>
                )}
                <HiChevronUp className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-blue-500`} />
              </Disclosure.Button>
              <Disclosure.Panel className=' pt-3 flex flex-row justify-between gap-0'>
                {deleteIdea && (
                  <div className='pt-3 flex flex-row justify-start gap-0'>
                    <Tippy content='Delete Idea From Vector Store & DB'>
                      <button
                        onClick={() => deleteIdea && deleteIdea(idea.id)}
                        className='flex flex-row justify-center items-center gap-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-bold px-3 py-1 text-sm rounded-lg'
                      >
                        <HiOutlineTrash className='h-5 w-5' />
                      </button>
                    </Tippy>
                  </div>
                )}
                <div className=' pt-3 flex flex-row justify-end gap-0'>
                  <Tippy content={!isUpdate ? 'Edit Idea & Add To Notes' : 'Edit & Update Note'}>
                    <button
                      onClick={() => handleEmbedIdeaPopover(idea)}
                      className='flex flex-row justify-center items-center gap-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-blue-500 font-bold px-3 py-1 text-sm rounded-l-lg'
                    >
                      <HiOutlineDocumentAdd className='h-5 w-5' />
                    </button>
                  </Tippy>
                  <Tippy content='Generate Tweet Draft From Idea'>
                    <button
                      onClick={() => handleGenerateTweetModal(idea.content, originalTweetContent)}
                      className='flex flex-row justify-center items-center gap-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-bold px-3 py-1 text-sm -ml-px rounded-r-lg'
                    >
                      <AiOutlineTwitter className='h-5 w-5' />
                    </button>
                  </Tippy>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
}
