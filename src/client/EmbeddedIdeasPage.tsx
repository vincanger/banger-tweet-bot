import StyleWrapper from './components/StyleWrapper';
import { useQuery } from '@wasp/queries';
import getEmbeddedIdeas from '@wasp/queries/getEmbeddedIdeas';
import Tippy from '@tippyjs/react';
import { AiOutlineInfoCircle, AiOutlineFileSearch, AiOutlineLoading } from 'react-icons/ai';
import { GiCancel } from 'react-icons/gi';
import Accordion from './components/Accordion';
import { useContext, useState, useEffect } from 'react';
import AppContext from './Context';
import { EditModal } from './GeneratedIdeasPage';
import type { GeneratedIdea, User } from '@wasp/entities';
import deleteIdea from '@wasp/actions/deleteIdea';
import fetchSimilarNotes from '@wasp/queries/fetchSimilarNotes';

export default function EmbeddedIdeasPage({ user }: { user: User }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [exampleTweet, setExampleTweet] = useState('');
  const [fetchQuery, setFetchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeneratedIdea[] | null>(null);

  const { data: embeddedIdeas, isLoading, error } = useQuery(getEmbeddedIdeas);
  const {
    data: similarNotes,
    isFetching: isFetchingSimilarNotes,
    refetch: searchSimilarNotes,
  } = useQuery(fetchSimilarNotes, { query: fetchQuery }, { enabled: false });

  const { popoverButtonRef, setIdeaObject } = useContext(AppContext);

  useEffect(() => {
    if (similarNotes?.length) {
      setSearchResults(similarNotes);
    }
  }, [similarNotes]);

  const handleGenerateTweetModal = (idea: string, example?: string) => {
    setModalContent(idea);
    if (example) setExampleTweet(example);
    setIsModalOpen((x) => !x);
  };

  const handleEmbedIdeaPopover = (idea: GeneratedIdea) => {
    popoverButtonRef.current?.click();
    setIdeaObject(idea);
  };

  const handleSearch = async () => {
    await searchSimilarNotes();
  };

  if (isLoading) {
    return (
      <StyleWrapper>
        <div className='flex flex-row justify-center mt-8'>Loading...</div>
      </StyleWrapper>
    );
  }

  if (error) {
    return (
      <StyleWrapper>
        <div className='flex flex-row justify-center mt-8'>{error.message}</div>
      </StyleWrapper>
    );
  }

  return (
    <StyleWrapper>
      <div className='flex flex-col sm:flex-row justify-center'>
        {embeddedIdeas?.length ? (
          <div className='flex flex-col items-center justify-center gap-2 border border-neutral-700 bg-neutral-100/40 rounded-xl p-1 sm:p-4 w-full md:w-4/5 lg:w-3/4 xl:w-3/5 2xl:w-1/2 '>
            <div className='flex flex-row justify-between items-center px-2 w-full '>
              {/* <div className='w-1/3'></div> */}
              <div className='flex justify-start items-center w-1/3'>
                <h2 className='font-bold'>Embedded Notes: </h2>
                <Tippy
                  placement={'top'}
                  content='These are the notes that have been embedded and saved to your vector store to help brainstorm related ideas.'
                >
                  <span className='ml-1'>
                    <AiOutlineInfoCircle />
                  </span>
                </Tippy>
              </div>
              <div className='inline-flex gap-0 w-2/3'>
                <input
                  type='text'
                  placeholder='Search'
                  onChange={(e) => setFetchQuery(e.target.value)}
                  disabled={isFetchingSimilarNotes}
                  className='w-full rounded-l-lg px-2 py-1 border border-neutral-300 border-r-0 text-sm  '
                />
                <button
                  onClick={handleSearch}
                  className='bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-bold px-3 py-1 text-lg rounded-r-lg'
                >
                  {isFetchingSimilarNotes ? <AiOutlineLoading className={`animate-spin`} /> : <AiOutlineFileSearch />}
                </button>
              </div>
            </div>
            {searchResults?.length ? (
              <div className='border border-neutral-500 bg-neutral-100 flex flex-col p-1 mt-4 sm:p-4 text-neutral-700 rounded-xl text-left w-full '>
                <div className='flex flex-row justify-between gap-2 items-center w-full'>
                  <h2 className='font-bold'>Search Results: </h2>
                  <button
                    onClick={() => setSearchResults(null)}
                    className='flex flex-row items-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700  px-3 py-1 text-sm rounded-lg'
                  >
                    <GiCancel className='inline-block mr-1' />
                    Reset Search Results
                  </button>
                </div>
                {searchResults.map((note) => (
                  <div key={note.content} className='flex flex-col w-full py-2 items-start text-left'>
                    <Accordion
                      idea={note}
                      key={note.updatedAt.getTime()}
                      handleEmbedIdeaPopover={handleEmbedIdeaPopover}
                      handleGenerateTweetModal={handleGenerateTweetModal}
                      deleteIdea={deleteIdea}
                      isUpdate
                    />
                  </div>
                ))}
              </div>
            ) : (
              embeddedIdeas
                .map((idea, index) => (
                  <div key={idea.content} className='flex flex-col w-full p-2 items-start text-left'>
                    <Accordion
                      idea={idea}
                      key={idea.updatedAt.getTime() + index}
                      handleEmbedIdeaPopover={handleEmbedIdeaPopover}
                      handleGenerateTweetModal={handleGenerateTweetModal}
                      deleteIdea={deleteIdea}
                      isUpdate
                    />
                  </div>
                ))
                .sort((a, b) => parseInt(b.props.children.key) - parseInt(a.props.children.key))
            )}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-4 border border-neutral-700 bg-neutral-100/40 rounded-xl p-1 sm:p-4 w-full  '>
            <span className='text-neutral-600 w-full'>
              You haven't saved any ideas yet. Try adding your own notes, ideas, and opinions above!{' '}
            </span>
          </div>
        )}
      </div>
      <EditModal
        idea={modalContent}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        username={user.username}
        exampleTweet={exampleTweet}
      />
    </StyleWrapper>
  );
}
