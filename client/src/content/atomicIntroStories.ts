export type AtomicIntroStory = {
  day: number;
  label: string;
  kicker: string;
  title: string;
  emphasis: string;
  story: string;
  action: string;
};

// Original JAMB Quest writing grounded in the user-authorised Atomic Habits themes.
// It deliberately paraphrases ideas rather than reproducing book passages.
export const ATOMIC_INTRO_STORIES: readonly AtomicIntroStory[] = [
  {
    day: 1,
    label: "MONDAY · RELATIONSHIP TIME",
    kicker: "Your circle can become your system.",
    title: "Choose the table that makes focus normal.",
    emphasis: "Focus normal.",
    story: "A serious student stops waiting for motivation from strangers. She tells one friend, ‘I am doing ten questions before we gist.’ Soon that friend begins asking, ‘Have you done your ten?’ The relationship did not distract her; it became a quiet agreement that protected her goal.",
    action: "Send one person your small study promise, then complete it before the day ends.",
  },
  {
    day: 2,
    label: "TUESDAY · RELATIONSHIP TIME",
    kicker: "Encouragement is strongest when it becomes specific.",
    title: "Turn support into a study signal.",
    emphasis: "Study signal.",
    story: "Two friends prepare for JAMB without comparing marks every night. Their rule is simple: each sends a screenshot after one focused round. On difficult days, the message is not ‘be motivated’; it is ‘start with five.’ Their friendship becomes a doorway back into action.",
    action: "Pick an accountability partner and agree on one tiny proof of work you can share today.",
  },
  {
    day: 3,
    label: "WEDNESDAY · RELATIONSHIP TIME",
    kicker: "The people around you can make your identity easier to keep.",
    title: "Be the friend who returns to the system.",
    emphasis: "Return to the system.",
    story: "A learner misses two study days and wants to disappear from the group chat. Instead, he writes one honest line: ‘I slipped; I am back with ten questions.’ Nobody needs a perfect friend. People trust the person who repairs quickly—and that same identity helps him repair his own study rhythm.",
    action: "If you slipped, do not explain for an hour. Return with one deliberate round.",
  },
  {
    day: 4,
    label: "THURSDAY · SYSTEM STORY",
    kicker: "Small evidence becomes a stronger identity.",
    title: "Cast one vote for the student you are becoming.",
    emphasis: "One vote.",
    story: "There is no magical afternoon when a student suddenly becomes disciplined. There are ordinary moments: opening the app, answering the next question, reading the correction, and returning tomorrow. Each moment is a vote. Enough votes make the identity believable before the final score arrives.",
    action: "Do one round that lets you say: ‘I kept a promise to my future score.’",
  },
  {
    day: 5,
    label: "FRIDAY · SYSTEM STORY",
    kicker: "Make the first step too small to negotiate with.",
    title: "Start before your mood has an opinion.",
    emphasis: "Start first.",
    story: "A student promises herself one chapter and feels tired before she begins. She changes the deal: open one topic, answer one question, read one explanation. The first question does not solve JAMB, but it breaks the argument with procrastination. Momentum enters through a very small door.",
    action: "Open one topic drill and answer the first question now; the next decision can wait.",
  },
  {
    day: 6,
    label: "SATURDAY · SYSTEM STORY",
    kicker: "Your environment should help the right action win.",
    title: "Put the next question where distraction used to live.",
    emphasis: "Make focus visible.",
    story: "A phone can hold both distraction and preparation. One learner moves games away from the first screen, leaves JAMB Quest visible, and studies with a charger beside her. Nothing about her personality changed overnight. The path simply became easier to follow.",
    action: "Before you leave this screen, make your next study action obvious and one distraction harder to reach.",
  },
  {
    day: 0,
    label: "SUNDAY · SYSTEM STORY",
    kicker: "A good week is prepared before Monday arrives.",
    title: "Review the evidence. Design the next return.",
    emphasis: "Design the return.",
    story: "Sunday is not for judging every imperfect score. It is for noticing what happened: which topic slowed you down, which hour worked, and what made you skip. A student who learns from the week does not need a dramatic restart. She needs a cleaner next cue.",
    action: "Choose tomorrow’s subject now, then let your first ten questions begin the new week.",
  },
] as const;

export function getAtomicIntroStory(date = new Date()) {
  return ATOMIC_INTRO_STORIES.find((story) => story.day === date.getDay()) ?? ATOMIC_INTRO_STORIES[0];
}
