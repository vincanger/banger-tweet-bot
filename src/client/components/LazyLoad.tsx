import { useState, useEffect, useRef, ReactNode } from 'react';

export default function LazyLoadComponent({ children } : { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setIsVisible(entry.isIntersecting));
    });

    const currentDomRef = domRef.current;
    if (currentDomRef) {
      observer.observe(currentDomRef);

      console.log('observer.observe(currentDomRef)', currentDomRef);

      return () => observer.unobserve(currentDomRef);
    }
  }, []);

  return <div ref={domRef}>{isVisible ? children : null}</div>;
}