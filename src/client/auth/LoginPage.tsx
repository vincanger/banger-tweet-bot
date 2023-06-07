import { LoginForm } from '@wasp/auth/forms/Login';
import { SignupForm } from '@wasp/auth/forms/Signup';
import { useState } from 'react';

export default () => {
  const [showSignupForm, setShowSignupForm] = useState(false);

  const handleShowSignupForm = () => {
    setShowSignupForm((x) => !x);
  };

  return (
    <div className='min-h-screen bg-amber-50'>
      <div className='w-full sm:w-2/3 mx-auto'>
        <div className='py-7 flex flex-col items-center'>
          {showSignupForm ? <SignupForm/> : <LoginForm />}
          {/* create a subtitle text div */}

            <div onClick={handleShowSignupForm} className='text-sm mt-5 underline'>
              {showSignupForm ? 'Already Registered? Login!' : 'No Account? Sign up!'}
            </div>

        </div>
      </div>
    </div>
  );
};
