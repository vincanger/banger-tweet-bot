import { createContext, RefObject } from 'react';
import type { GeneratedIdea } from '@wasp/entities';

const AppContext = createContext({
  popoverButtonRef: null as unknown as RefObject<HTMLButtonElement>,
  editedIdea: '',
  setEditedIdea: (idea: string) => {},
  ideaObject: null as GeneratedIdea | null,
  setIdeaObject: (idea: GeneratedIdea | null) => {},
});

export default AppContext;
