import { Menu } from '@headlessui/react';
import { PillButton } from '../GeneratedIdeasPage';
import generateTweetDraftsAndIdeas from '@wasp/actions/generateTweetDraftsAndIdeas';
import { useState } from 'react';
import { MdOutlineAutoAwesome } from 'react-icons/md';
import { TfiWrite } from 'react-icons/tfi';
import { BsMagic } from 'react-icons/bs';

export default function MyDropdown() {
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  const handleBrainstormAction = async () => {
    try {
      setIsBrainstorming(true);
      await generateTweetDraftsAndIdeas();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBrainstorming(false);
    }
  };

  const style =
    'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-neutral-600 hover:border-neutral-800 hover:text-neutral-800';

  const itemStyle = (active: any) => `inline-flex w-full py-1 px-2 text-neutral-500 font-bold text-left rounded-md ${active ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-50'}`;

  return (
    <Menu as='div' className={style}>
      <Menu.Button className='inline-flex items-center'>
        <MdOutlineAutoAwesome className='h-6 w-6 mr-2' />
        <span className='hidden sm:block'>Menu</span>
      </Menu.Button>
      <Menu.Items className='fixed top-16 mt-2 px-4 py-4  max-w-sm flex flex-col items-start gap-2 p-2 rounded-lg border border-1 border-neutral-300 rounded-md bg-neutral-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
        <Menu.Item>
          {({ active }) => (
            <a className={itemStyle(active)} href='/'>
              <BsMagic className='h-4 w-4 mr-1' />
              <span>Generated Drafts & Ideas</span>
            </a>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <a className={itemStyle(active)} href='/embedded-ideas'>
              <TfiWrite className='h-4 w-4 mr-1' />
              <span>Your Notes</span>
            </a>
          )}
        </Menu.Item>
        <Menu.Item>
          <>
            <hr className='border-1 border-neutral-200 w-full' />

            <PillButton textColor='text-neutral-500' onClick={handleBrainstormAction} isLoading={isBrainstorming}>
              🧠 Brainstorm New Tweet Drafts & Ideas
            </PillButton>
          </>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
