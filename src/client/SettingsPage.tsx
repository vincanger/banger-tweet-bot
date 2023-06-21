import Tippy from '@tippyjs/react';
import { PillButton } from './GeneratedIdeasPage';
import { AiOutlineTwitter, AiOutlineInfoCircle, AiOutlineArrowLeft } from 'react-icons/ai';
import { ChangeEvent, useEffect, useState } from 'react';
import twitterAuth from '@wasp/actions/twitterAuth';
import updateSettings from '@wasp/actions/updateSettings';
import { useQuery } from '@wasp/queries';
import getAccessTokens from '@wasp/queries/getAccessTokens';
import logout from '@wasp/auth/logout';
import type { User } from '@wasp/entities';

const SettingsPage = ({ user }: { user: User }) => {
  const { data: accessTokens, isLoading } = useQuery(getAccessTokens);

  const handleTwitterAuth = async () => {
    const res = await twitterAuth();
    window.location.href = res;
  };

  if (isLoading) return <div className='flex flex-row justify-center mt-8'>Loading...</div>;

  return (
    <div className='flex flex-col justify-center items-center mx-auto mt-12'>
      <div className='flex flex-col items-center justify-center gap-4 border border-neutral-700 bg-neutral-100/40 rounded-xl p-1 sm:p-4 w-full md:w-4/5 lg:w-3/4 xl:w-3/5 2xl:w-1/2 '>
        <div className='flex flex-row justify-between w-full px-4 pt-2'>
          <div className='w-1/3' />
          <div className='w-1/3 flex flex-row justify-center'>
            <PillButton onClick={handleTwitterAuth}>
              {!!accessTokens ? 'Twitter Account Connected' : 'Connect Your Twitter Account'}
              <AiOutlineTwitter className='h-4 w-4 ml-1' />
            </PillButton>
          </div>
          <div className='w-1/3 flex flex-row justify-end'>
            <PillButton onClick={logout} textColor='text-neutral-600'>
              Logout
              <AiOutlineArrowLeft className='h-4 w-4 ml-1 pt-1' />
            </PillButton>
          </div>
        </div>
        <InputFields user={user} />
      </div>
    </div>
  );
};

export default SettingsPage;

export function InputFields({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fields, setFields] = useState(['']);

  useEffect(() => {
    if (user?.favUsers.length > 0) {
      setFields(user.favUsers);
    }
  }, [user?.favUsers]);

  const handleAdd = () => {
    setFields([...fields, '']);
  };

  const handleRemove = () => {
    const newFields = [...fields];
    newFields.splice(fields.length - 1, 1);
    setFields(newFields);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    // remove @ symbol if it exists
    if (e.target.value[0] === '@') {
      e.target.value = e.target.value.slice(1);
    }
    const newFields = [...fields];
    newFields[index] = e.target.value;
    setFields(newFields);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await updateSettings({ favUsers: fields });
      setIsSaved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }
  };

  return (
    <div className='w-full p-4'>
      <div className='flex flex-row justify-start items-start'>
        <h2 className='ml-1 font-bold'>Trend-Setting Twitter Accounts</h2>
        <Tippy
          placement={'top'}
          content='Recent tweets from your these twitter accounts, along with your own notes, will be used to generate new ideas and tweet drafts. Try to include at least 3 accounts.'
        >
          <span className='ml-1'>
            <AiOutlineInfoCircle />
          </span>
        </Tippy>
      </div>
      {fields.map((field, index) => (
        <div key={index} className='my-2'>
          <input
            type='text'
            placeholder='Twitter Username'
            className='w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 focus:border-blue-400 focus:outline-none'
            value={field}
            onChange={(e) => handleChange(e, index)}
          />
        </div>
      ))}
      <div className='my-2 flex flex-row justify-end gap-1'>
        {fields.length > 1 && (
          <PillButton
            onClick={handleRemove}
            textColor='text-red-500'
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            -
          </PillButton>
        )}
        {fields.length < 10 && (
          <PillButton onClick={handleAdd} className='bg-blue-500 text-white px-4 py-2 rounded'>
            +
          </PillButton>
        )}
      </div>
      <PillButton onClick={handleSubmit} isLoading={isLoading}>
        <Tippy content='Saved!' visible={isSaved} onClickOutside={() => setIsSaved(false)}>
          <span>Save</span>
        </Tippy>
      </PillButton>
    </div>
  );
}
