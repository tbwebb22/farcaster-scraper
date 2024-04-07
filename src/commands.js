import { FeedType, FilterType } from "@neynar/nodejs-sdk";
import { getClient } from "./client.js";
import fs from 'fs';

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

    const uniqueResults = [...new Set(results.map((cast) => JSON.stringify(cast)))].map((jsonStr) => JSON.parse(jsonStr));
    const concatenatedTexts = uniqueResults.map(result => result.text).join(' ');
    
    const filename = `casts-${argv.channelId}.txt`;

    // Write the uniqueResults to a file
    fs.writeFile(filename, concatenatedTexts, 'utf8', (err) => {
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
