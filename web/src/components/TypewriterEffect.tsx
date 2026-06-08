import { useState, useEffect } from 'react';

const slogans = [
  "Welcome to MedhaX",
  "Test Your Coding Skills",
  "Challenge Your Friends",
  "Master Programming Concepts",
  "Supporting 8 Languages",
  "Python, JS, Java, C++, C, DBMS, DSA, OS"
];

const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const PAUSE_DURATION = 2000;

export default function TypewriterEffect() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(TYPING_SPEED);

  useEffect(() => {
    let timer = setTimeout(() => {
      handleType();
    }, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum]);

  const handleType = () => {
    const i = loopNum % slogans.length;
    const fullText = slogans[i];

    setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1));

    setTypingSpeed(isDeleting ? DELETING_SPEED : TYPING_SPEED);

    if (!isDeleting && text === fullText) {
      setTimeout(() => setIsDeleting(true), PAUSE_DURATION);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
    }
  };

  return (
    <span className="gradient-text">
      {text}
      <span className="cursor">|</span>
    </span>
  );
}
