import { GREETINGS } from "@/app/constants/greetings";
import { useState, useEffect } from "react";

export function TypingGreeting() {
  const [mounted, setMounted] = useState(false);
  const [display, setDisplay] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let phase: 'typing' | 'paused' | 'deleting' = 'typing';
    let text = '';
    let index = Math.floor(Math.random() * GREETINGS.length);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setDisplay(GREETINGS[index].greeting + '.');
      setIsTyping(false);
      return;
    }

    const tick = () => {
      if (!alive) return;
      const target = GREETINGS[index].greeting + '.';

      if (phase === 'typing') {
        setIsTyping(true);
        if (text.length < target.length) {
          text = target.slice(0, text.length + 1);
          setDisplay(text);
          timer = setTimeout(tick, 60);
        } else {
          setIsTyping(false);
          phase = 'paused';
          timer = setTimeout(tick, 2000);
        }
      } else if (phase === 'paused') {
        setIsTyping(true);
        phase = 'deleting';
        timer = setTimeout(tick, 35);
      } else if (phase === 'deleting') {
        setIsTyping(true);
        if (text.length > 0) {
          text = text.slice(0, -1);
          setDisplay(text);
          timer = setTimeout(tick, 35);
        } else {
          let next;
          do { next = Math.floor(Math.random() * GREETINGS.length); }
          while (next === index && GREETINGS.length > 1);
          index = next;
          phase = 'typing';
          timer = setTimeout(tick, 60);
        }
      }
    };

    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [mounted]);

  if (!mounted) return (
    <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center h-10 sm:h-12" />
  );

  return (
    <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center h-10 sm:h-12">
      {display}
      <span
        className={`inline-block font-sans text-zinc-400 font-light -translate-y-0.5 ml-0.5 ${!isTyping ? 'animate-pulse' : ''}`}
        style={{ animationDuration: '1s' }}
      >
        |
      </span>
    </h1>
  );
}