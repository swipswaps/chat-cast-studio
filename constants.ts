
import type { PodcastStyle, TechnicalityLevel } from './types';

export const PODCAST_STYLES: PodcastStyle[] = [
  {
    id: 'narrative_interview',
    name: 'Narrative Interview',
    description: 'A host-driven conversation that feels like an engaging interview, with clear questions and narrative flow.',
  },
  {
    id: 'explainer_dialogue',
    name: 'Explainer Dialogue',
    description: 'A clear, educational format where two speakers break down a complex topic for the listener.',
  },
  {
    id: 'tech_deep_dive',
    name: 'Tech Deep-Dive',
    description: 'Focuses on technical details, with code blocks explained thoroughly. For an expert audience.',
  },
  {
    id: 'light_tech_radio',
    name: 'Light Tech Radio',
    description: 'A more casual, audience-friendly chat about technology, avoiding deep jargon and focusing on concepts.',
  },
];

export const TECHNICALITY_LEVELS: TechnicalityLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Explain all concepts simply. Replace code with high-level descriptions.',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Assume some familiarity. Explain complex code snippets, but summarize simple ones.',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'For experts. Focus on nuances and include short, verbatim code excerpts where impactful.',
  },
];

export const EXAMPLE_CHAT_JSON = JSON.stringify([
    { "role": "user", "content": "Hey, can you explain what a React Hook is?" },
    { "role": "assistant", "content": "Of course! React Hooks are functions that let you 'hook into' React state and lifecycle features from function components. Before Hooks, you'd have to use a class component to manage state or use lifecycle methods." },
    { "role": "user", "content": "So, like `useState`?" },
    { "role": "assistant", "content": "Exactly! `useState` is one of the most common Hooks. It lets you add state to a functional component. For example:\n```javascript\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\nHere, `useState(0)` initializes a state variable `count` to 0 and gives us a function `setCount` to update it." },
    { "role": "user", "content": "That makes sense. What about `useEffect`?" },
    { "role": "assistant", "content": "Great question. `useEffect` lets you perform side effects in function components. That includes things like data fetching, setting up a subscription, or manually changing the DOM. It runs after every render by default, but you can control when it runs. It's like a combination of `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` from class components." }
]);

export const EXAMPLE_CHAT_TEXT = `
user: I'm trying to set up a basic Express server. What's the minimal code I need?

assistant: You can get a server running with just a few lines of code. First, make sure you have Node.js and npm installed, then run \`npm init -y\` and \`npm install express\`.

assistant: Here is the minimal code for a file like \`index.js\`:

assistant: \`\`\`javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Example app listening on port \${port}\`);
});
\`\`\`

user: Okay, what does each part do?

assistant: Good question. 
1. \`require('express')\` imports the express library.
2. \`express()\` creates an instance of an Express application.
3. \`app.get('/', ...)\` defines a route handler for GET requests to the root URL ('/'). When someone visits your site's homepage, it sends back 'Hello World!'.
4. \`app.listen(port, ...)\` starts up the server on the specified port (3000) and prints a log message to the console once it's running.

user: Perfect, thanks!
`;
