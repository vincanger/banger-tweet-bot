import { useState, useEffect, useRef, MouseEvent } from 'react';
import { AiOutlineLoading } from 'react-icons/ai';

const twitterIcon = twitterSvg();

export default function DraftTweetWrapper({
  username,
  newTweet,
  sendTweet,
  id,
}: {
  username: string;
  newTweet: string;
  sendTweet: (tweetContent: string) => Promise<any>;
  id?: string;
}) {
  const [isTweetSending, setIsTweetSending] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendTweet = async (e: MouseEvent<HTMLButtonElement>) => {
    try {
      setIsTweetSending(true);
      // get tweet content from textarea ref
      if (!textAreaRef.current?.value) throw new Error('Tweet content is empty!');
      const tweetContent = textAreaRef.current?.value;
      console.log('new Tweet to send', tweetContent);
      const res = await sendTweet(tweetContent.trim());
      // console.log('res: ', res);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsTweetSending(false);
    }
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
    return () => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
      }
    };
  }, [textAreaRef.current]);

  return (
    <div
      key={newTweet}
      className={`flex flex-col text-left border bg-white/70 p-2 text-neutral-700 rounded-xl w-[335px]`}
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
          id={String(id || 0)}
          className='border border-neutral-300 p-2 rounded-lg w-full text-neutral-700'
          ref={textAreaRef}
          // onChange={handleNewTweetChange}
          defaultValue={newTweet}
          style={{ height: textAreaRef.current?.scrollHeight + 'px' }}
        />
      </div>
      <div className='border-t border-neutral-500 bg-white/70 flex flex-row m-2 ' />
      <div className='flex flex-row p-1'>
        <div className='flex flex-col mx-2'>
          <div className='text-sm text-neutral-600'>{new Date().toDateString()}</div>
        </div>
      </div>

      <div className='flex flex-row justify-center gap-1 m-1'>
        <button
          className={`flex flex-row justify-center items-center bg-neutral-100 hover:bg-neutral-200 w-full border border-neutral-300 text-blue-500 font-bold m-1 px-3 py-1 text-sm rounded-2xl ${
            isTweetSending ? ' pointer-events-none opacity-70' : 'cursor-pointer'
          }`}
          onClick={handleSendTweet}
        >
          <AiOutlineLoading className={`animate-spin absolute ${isTweetSending ? 'block' : 'invisible'}`} />
          <span className={`${isTweetSending ? 'invisible' : 'block'}`}>Send Tweet</span>
        </button>
      </div>
    </div>
  );
}

export function twitterSvg() {
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