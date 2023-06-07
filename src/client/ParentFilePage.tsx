import waspLogo from './waspLogo.png';
import { useEffect } from 'react';
import { useQuery } from '@wasp/queries';
// import getEmbeddedTextChunk from '@wasp/queries/getEmbeddedTextChunk';

const ParentFilePage = ({ match }: any) => {
  const idOfTextChunk = match.params.id;

  // const { data, isLoading } = useQuery(getEmbeddedTextChunk, idOfTextChunk);

  // useEffect(() => {
  //   if (!data) return;
  //   document.getElementById('highlighted')?.scrollIntoView({ behavior: 'smooth' });
  // }, [data]);

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
        </div>
        {/* <div className='flex justify-center items-center '>
          {isLoading
            ? 'Loading...'
            : data && (
                <div className='border border-neutral-700 rounded-lg p-7 grid grid-rows-3 gap-7'>
                  {data?.parentFile &&
                    data.parentFile.textChunks.map((chunk, index) => (
                      <div
                        key={index}
                        id={chunk.id == idOfTextChunk ? 'highlighted' : `chunk-${index}`}
                        className={`border ${
                          chunk.id == idOfTextChunk
                            ? 'border-neutral-500 bg-yellow-500/30'
                            : `border-neutral-700 bg-neutral-200/20`
                        }  flex flex-col p-7 text-neutral-700 rounded-lg`}
                      >
                        <div className='mb-2 flex'>
                          <div className='font-bold mr-2'>TITLE:</div> {chunk.title}
                        </div>
                        <div>
                          <div className='font-bold mr-2'>CONTENT:</div> {chunk.content}
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
export default ParentFilePage;
