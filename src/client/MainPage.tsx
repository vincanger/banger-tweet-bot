import waspLogo from './waspLogo.png';
import './Main.css';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@wasp/queries';
import generateMemory from '@wasp/actions/generateMemory';
import api from '@wasp/api';

const URL = 'http://localhost:3001';

const MainPage = () => {
  const [query, setQuery] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const twitterAuth = async () => {

    window.location.href = URL + '/twitter/auth'
  }

  // we keep to keep the query disabled until the user enters a query
  // then we refetch() on demand in the useEffect below
  // const { data, isFetching, refetch } = useQuery(
  //   searchEmbeddings,
  //   { inputQuery: query, resultNum: 3 },
  //   { enabled: false }
  // );

  // const { data: filesAlreadyEmbedded } = useQuery(getEmbeddedFilenames);

  // useEffect(() => {
  //   if (query.length < 1) return;
  //   refetch();
  // }, [query]);

  const handleSearch = async () => {
    if (!textAreaRef.current) return;
    const inputQuery = textAreaRef.current.value;
    setQuery(inputQuery);
  };

  const handleGenerateMemory = async () => {
    await generateMemory();
  };

  return (
    <div className='min-h-screen bg-amber-50'>
      <div className='w-full sm:w-2/3 mx-auto'>
        <div className='py-7 flex flex-col items-center'>
          <div className='flex pb-7 justify-center items-center'>
            <img src={waspLogo} className='h-6 mr-2 ' alt='wasp' />
            <h1 className='text-xl ml-1'>Generate Embeddings and Perform Vector Searches w/ Wasp!</h1>
          </div>
          <div className='flex pb-7 items-center justify-evenly w-full'>
            <div className='w-2/6 border-t border-neutral-700'></div>
            <span className='text-neutral-700 text-center'>✨ 🐝 ✨</span>
            <div className='w-2/6 border-t border-neutral-700'></div>
          </div>
          <div className='flex space-x-12 justify-center w-full'>
            <div className='flex flex-col rounded-lg border border-neutral-700 p-7 w-full'>
              <div className='flex items-center space-x-2'>
                <button
                  className='shadow px-2 py-1 text-neutral-700 bg-yellow-400 rounded whitespace-nowrap'
                  onClick={handleGenerateMemory}
                >
                  🔎 generate memory test
                </button>
                <button
                  className='shadow px-2 py-1 text-neutral-700 bg-yellow-400 rounded whitespace-nowrap'
                  onClick={twitterAuth}
                >
                  twitter auth test
                </button>
                <div className='font-bold'> 📁 You've embedded these Files: </div>{' '}
              </div>
              {/* {filesAlreadyEmbedded ? (
                <ul className='mb-4 indent-4'>
                  {filesAlreadyEmbedded.length > 0 ? (
                    filesAlreadyEmbedded.map((file, index) => (
                      <li className='' key={index}>
                        * {file}
                      </li>
                    ))
                  ) : (
                    <div>
                      No files embedded yet. 🙅‍♀️
                      <div className='italic opacity-80'> Generate embeddings by running `wasp db seed` in the CLI</div>
                    </div>
                  )}
                </ul>
              ) : (
                <div className='italic opacity-80'>Loading...</div>
              )} */}
            </div>
            {/* <div className='flex flex-col justify-between rounded-lg border border-neutral-700 p-7 w-full'>
              <textarea
                ref={textAreaRef}
                className='shadow appearance-none border border-neutral-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline'
                placeholder='Enter query'
              />
              {!isFetching ? (
                <button
                  className='shadow px-2 py-1 text-neutral-700 bg-yellow-400 rounded whitespace-nowrap'
                  onClick={handleSearch}
                >
                  🔎 Search Your Embeddings
                </button>
              ) : (
                <button
                  className='shadow px-2 py-1 text-neutral-700 bg-yellow-400 rounded whitespace-nowrap opacity-50'
                  disabled
                >
                  🔎 Searching...
                </button>
              )}
            </div> */}
          </div>
        </div>
        {/* <div className='flex justify-center items-center '>
          {data && data.length > 0 && (
            <div className='border border-neutral-700 rounded-lg p-7 grid grid-rows-3 gap-7'>
              {data.map((result, index) => (
                <div
                  key={index}
                  className='border border-neutral-500 flex flex-col p-7 bg-yellow-500/30 text-neutral-700 rounded-lg'
                >
                  <div className='mb-2 flex'>
                    <div className='font-bold mr-2'>TITLE:</div> {result.title}
                  </div>
                  <a href={`/parentfile/${result.id}`}>
                    <div className='mb-2 flex'>
                      <div className='underline'>Click here </div> &nbsp; to see the text chunk in context with the rest
                      of the file.
                    </div>
                  </a>

                  <div>
                    <div className='font-bold mr-2'>CONTENT:</div> {result.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};
export default MainPage;
