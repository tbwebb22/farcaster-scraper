import { FeedType, FilterType } from "@neynar/nodejs-sdk";
import { getClient } from "./client.js";
import fs from 'fs/promises'; // Correct import for using async/await
import path from 'path'; // Add this line to import the path module

function isCastValid(cast, likeThreshold, recastThreshold, followerCountThreshold) {
  return (
    (cast.reactions.likes.length > likeThreshold ||
      cast.reactions.recasts.length > recastThreshold) &&
    cast.author.follower_count > followerCountThreshold
  );
}

async function fetchCasts({
  apiKey,
  channelId,
  limit,
  likeThreshold,
  recastThreshold,
  followerCountThreshold,
  urlDomainFilter,
  maxResults,
  maxQueries,
}) {
  console.log("fetching");
  const client = getClient(apiKey);

  let allResults = [];
  let nextCursor = null;
  let queryCount = 0;

  do {
    const { casts, next } = await client.fetchFeed(FeedType.Filter, {
      filterType: FilterType.ChannelId,
      channelId: channelId,
      withRecasts: true,
      withReplies: false,
      limit: limit,
      cursor: nextCursor,
    });

    queryCount++;

    const filteredCasts = casts
      .filter((cast) => isCastValid(cast, likeThreshold, recastThreshold, followerCountThreshold))
      .map(( cast, index, likes ) => ({ index: index, text: cast.text, likes: cast.reactions.likes.length }));

    allResults.push(...filteredCasts);
    nextCursor = next && next.cursor;
    console.log("nextCursor: ", nextCursor);
    console.log("maxResults: ", allResults.length, " ", maxResults);
    console.log("maxQueries: ", queryCount, " ", maxQueries);
  } while (
    nextCursor &&
    (!maxResults || allResults.length < maxResults) &&
    (!maxQueries || queryCount < maxQueries)
  );

  return allResults;
}

export async function fetchCastsHandler(argv) {
  try {
    const results = await fetchCasts({
      apiKey: process.env.NEYNAR_API_KEY,
      channelId: argv.channelId,
      limit: argv.limit,
      likeThreshold: argv.likeThreshold,
      recastThreshold: argv.recastThreshold,
      followerCountThreshold: argv.followerCountThreshold,
      urlDomainFilter: argv.urlDomainFilter,
      maxResults: argv.maxResults,
      maxQueries: argv.maxQueries,
    });

    // console.log("results: ", results);

    const uniqueResults = [...new Set(results.map((cast) => JSON.stringify(cast)))].map((jsonStr) => JSON.parse(jsonStr));
    const concatenatedTexts = uniqueResults.map(result => result.text).join(' ');
    
    const filename = `casts-${argv.channelId}.txt`;

    // Define the directories and filename
    const directoryPath = path.join('channels', argv.channelId); // Construct the directory path
    const outputFilename = path.join(directoryPath, 'rawData'); // Construct the full file path

    // // Ensure the directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    // Write the uniqueResults to a file
    fs.writeFile(outputFilename, concatenatedTexts, 'utf8', (err) => {
      if (err) {
        console.error('An error occurred while writing the file:', err);
      } else {
        console.log(`Casts have been saved to ${filename}`);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
