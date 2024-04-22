// Importing necessary modules using ESM syntax
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

// Get the folder name from the command line arguments
const folderName = process.argv[2];

if (!folderName) {
    console.error('Please provide a folder name as a command line argument.');
    process.exit(1);
}

// Paths to the input and output files
const inputFile = path.join('channels', folderName, 'tokenized-shortened');
const outputFile = path.join('channels', folderName, 'tokenized-shortened-normalized');

// Function to read data, adjust frequencies, and write to a new file
async function adjustFrequencies() {
    try {
        const data = await fs.readFile(inputFile, 'utf8');
        const entries = JSON.parse(data);

        // Find the maximum frequency
        const maxFrequency = entries.reduce((max, entry) => Math.max(max, (entry.frequency)**0.4), 0);

        // Calculate multiplier to scale the highest frequency to 70
        const multiplier = 70 / maxFrequency;

        // Adjust frequencies
        const adjustedEntries = entries.map(entry => ({
            token: entry.token,
            frequency: Math.round((entry.frequency**0.4) * multiplier)
        }));

        // Write adjusted data to a new file
        await fs.writeFile(outputFile, JSON.stringify(adjustedEntries, null, 2), 'utf8');
        console.log('Frequencies adjusted and saved to:', outputFile);
    } catch (err) {
        console.error('Error:', err);
    }
}

// Run the function
adjustFrequencies();
