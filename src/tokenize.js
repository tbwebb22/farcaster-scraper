import fs from 'fs/promises';
import path from 'path';
import natural from 'natural';
const tokenizer = new natural.WordTokenizer();

async function analyzeText(channelId) {
  // Define the static path for the input text file
  const inputFilePath = path.join('channels', channelId, 'rawData');

  try {
    const text = await fs.readFile(inputFilePath, 'utf8');
    const tokens = tokenizer.tokenize(text.toLowerCase());

    let frequency = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});

    let frequencyArray = Object.keys(frequency).map(token => ({
      token: token,
      frequency: frequency[token]
    }));

    // Sort the array by frequency in descending order
    frequencyArray.sort((a, b) => b.frequency - a.frequency);

    // Define the directories and filename
    const directoryPath = path.join('channels', channelId);
    const outputFilename = path.join(directoryPath, 'tokenized');

    // Ensure the directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    // Write the results to the specified file inside the folder structure
    await fs.writeFile(outputFilename, JSON.stringify(frequencyArray, null, 2), 'utf8');
    console.log(`Results have been saved to ${outputFilename}`);
  } catch (err) {
    console.error('Error processing the file:', err);
  }
}

// Get the channelId from the command line arguments
const channelId = process.argv[2];

if (channelId) {
  analyzeText(channelId);
} else {
  console.log("Please provide a channelId as an argument.");
}
