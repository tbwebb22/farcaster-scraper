import fs from 'fs/promises';
import path from 'path';

// Custom tokenizer that includes emojis
function tokenizeIncludingEmojis(text) {
  // Regular expression to match words and emojis
  const regex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})|(\w+)/gu;
  const tokens = text.match(regex) || [];
  return tokens.map(token => token.toLowerCase()); // Convert to lower case to ensure consistent frequency counting
}

async function analyzeText(channelId) {
  const inputFilePath = path.join('channels', channelId, 'rawData');

  try {
    const text = await fs.readFile(inputFilePath, 'utf8');
    // Use the custom tokenizer instead of natural's WordTokenizer
    const tokens = tokenizeIncludingEmojis(text);

    let frequency = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});

    let frequencyArray = Object.keys(frequency).map(token => ({
      token: token,
      frequency: frequency[token]
    }));

    frequencyArray.sort((a, b) => b.frequency - a.frequency);

    const directoryPath = path.join('channels', channelId);
    const outputFilename = path.join(directoryPath, 'tokenizedEmojis');

    await fs.mkdir(directoryPath, { recursive: true });
    await fs.writeFile(outputFilename, JSON.stringify(frequencyArray, null, 2), 'utf8');
    console.log(`Results have been saved to ${outputFilename}`);
  } catch (err) {
    console.error('Error processing the file:', err);
  }
}

const channelId = process.argv[2];

if (channelId) {
  analyzeText(channelId);
} else {
  console.log("Please provide a channelId as an argument.");
}
