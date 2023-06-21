import { AiOutlineGithub } from 'react-icons/ai';
import { ReactNode, ReactElement } from 'react';

export default function ({ children, extraElement }: { children: ReactNode, extraElement?: ReactElement }) {
  return (
    <div className='sm:inline-block mx-auto w-full'>
      <div className='py-7 flex flex-col items-center '>
        <div className='flex pb-4 pt-4 items-center justify-center items-center px-3 w-full'>
          <div className='w-1/6 border-t border-neutral-700'></div>
          <div className='flex flex-row gap-1  text-neutral-500  px-5 '>
            <span className='px-3'>
              Made with{' '}
              <a href='https://js.langchain.com/docs/' className='hover:underline hover:text-neutral-700'>
                LangChain
              </a>
              ,{' '}
              <a href='https://pinecone.io' className='hover:underline hover:text-neutral-700'>
                Pinecone
              </a>
              , and{' '}
              <a href='https://wasp-lang.dev' className='hover:underline hover:text-neutral-700'>
                {'Wasp = }'}
              </a>
            </span>

            <a
              href='https://github.com/vincanger/banger-tweet-bot'
              className='flex flex-row justify-center items-center'
            >
              <AiOutlineGithub className='text-xl text-neutral-500 hover:text-neutral-700' />
            </a>
          </div>
          <div className='w-1/6 border-t border-neutral-700'></div>
        </div>
        {extraElement}
      </div>
      {children}
    </div>
  );
}
