import { format, parseISO } from 'date-fns';
import fs from 'fs';
import path from 'path';

interface Tweet {
  timestamp: string;
  tweet: {
    id: string;
    text: string;
  };
}

interface AIThought {
  timestamp: string;
  prompt: string;
  personality: string;
  generatedText: string;
}

function readTweets(): Tweet[] {
  try {
    const tweetLogPath = path.join(process.cwd(), '..', 'commands', 'cheshire-bot', 'output', 'tweet-log.jsonl');
    const content = fs.readFileSync(tweetLogPath, 'utf-8');
    return content
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error reading tweets:', error);
    return [];
  }
}

function readAIThoughts(): AIThought[] {
  try {
    const thoughtsDir = path.join(process.cwd(), '..', 'commands', 'cheshire-bot', 'output', 'generated-text');
    const files = fs.readdirSync(thoughtsDir);
    return files
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const content = fs.readFileSync(path.join(thoughtsDir, file), 'utf-8');
        const lines = content.split('\n');
        // Convert filename to ISO timestamp
        const timestamp = file
          .replace('.txt', '')
          .replace(/T/g, ' ')
          .replace(/-/g, ':')
          .replace(/Z$/, '');
        const prompt = lines.find(line => line.startsWith('Prompt:'))?.replace('Prompt:', '').trim() || '';
        const personality = lines.find(line => line.startsWith('Personality:'))?.replace('Personality:', '').trim() || '';
        const generatedText = lines.find(line => line.startsWith('Generated Text:'))?.replace('Generated Text:', '').trim() || '';
        return { timestamp, prompt, personality, generatedText };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error reading AI thoughts:', error);
    return [];
  }
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM d, yyyy HH:mm:ss');
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return 'Invalid Date';
  }
}

export default function Dashboard() {
  const tweets = readTweets();
  const thoughts = readAIThoughts();

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Cheshire Cat Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tweets Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
              </svg>
              Recent Tweets
            </h2>
            <div className="space-y-4">
              {tweets.map((tweet, index) => (
                <div key={index} className="bg-gray-700 rounded p-4">
                  <p className="text-gray-300 text-sm mb-2">
                    {formatDate(tweet.timestamp)}
                  </p>
                  <p className="text-lg">{tweet.tweet.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Thoughts Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Thoughts
            </h2>
            <div className="space-y-4">
              {thoughts.map((thought, index) => (
                <div key={index} className="bg-gray-700 rounded p-4">
                  <p className="text-gray-300 text-sm mb-2">
                    {formatDate(thought.timestamp)}
                  </p>
                  <p className="text-purple-400 text-sm mb-1">Personality: {thought.personality}</p>
                  <p className="text-blue-400 text-sm mb-2">Prompt: {thought.prompt}</p>
                  <p className="text-lg">{thought.generatedText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
