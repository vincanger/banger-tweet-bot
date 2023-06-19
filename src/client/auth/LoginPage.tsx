import { LoginForm } from '@wasp/auth/forms/Login';
import { SignupForm } from '@wasp/auth/forms/Signup';
import { useState } from 'react';
import { AiOutlineGithub } from 'react-icons/ai';

export default () => {
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  const handleShowSignupForm = () => {
    setShowSignupForm((x) => !x);
  };

  const appearance = {
    colors: {// blue
      brand: 'text-neutral-800',
      brandAccent: '#3482F6', // pink
    },
  };

  return (
    <div className='min-h-screen bg-neutral-300/70'>
      <div className='w-full sm:w-2/3 mx-auto'>
        <div className='py-7 flex flex-col gap-4 items-center'>
              <h2 className='py-4 text-3xl font-bold text-neutral-700'>💥 BANGER TWEET BOT 🤖</h2>
          <div className='flex pb-4 pt-4 items-center justify-center items-center px-3 w-3/5 '>
            <div className='flex flex-col sm:flex-row gap-1 text-neutral-500 px-5 pb-3 '>

              <span className='px-3 text-sm'>
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
          </div>
            <div className='w-2/3 sm:w-1/2 border-t border-dashed border-neutral-700'></div>
          {showSignupForm ? <SignupForm appearance={appearance} /> : <LoginForm appearance={appearance} />}
          {/* create a subtitle text div */}
          {showSignupForm && (
            <div className='mt-5'>ℹ️ It's best to use your twitter username when registering for this app</div>
          )}

          <div onClick={handleShowSignupForm} className='text-sm mt-5 underline'>
            {showSignupForm ? 'Already Registered? Login!' : 'No Account? Sign up!'}
          </div>
        </div>
      </div>
    </div>
  );
};
