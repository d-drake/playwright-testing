import { chromium, Page } from "playwright";
import type { PostDetailsArray } from "../../types";

/**
 * get the post details from the current/loaded Hacker News page
 *
 * @param {Page} page
 * @param {PostDetailsArray} listPostDetails
 * @return {Promise<PostDetailsArray>}
 */
async function getHackerNewsPagePostsDetails(
  page: Page,
  listPostDetails: PostDetailsArray
): Promise<PostDetailsArray> {
  // select all post elements
  const postElements = await page.locator("tr.athing.submission").all();
  // select all subtext elements
  const spanAgeElements = await page
    .locator("td.subtext")
    .locator("span.age")
    .all();
  // extract all posts with their rank from postElements
  const posts = [];
  for (const postElement of postElements) {
    const postId = await postElement.getAttribute("id");
    const rank = await postElement.locator("span.rank").innerText();
    posts.push({ postId, rank });
  }
  // extract all postDates from subtextElements...
  for (const spanAgeElement of spanAgeElements) {
    const age = await spanAgeElement
      .getAttribute("title")
      .then(
        (title) => title!.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0]
      );
    const href = await spanAgeElement.getByRole("link").getAttribute("href");
    // by checking the the postId of the href,
    const thisPostId = href!.match(/\d+/)?.[0];
    // then using this value to match to the rank from the posts array.
    const thisRank = posts.find((post) => post.postId === thisPostId)?.rank;
    listPostDetails.push({
      postId: thisPostId!,
      rank: thisRank!,
      postDate: new Date(age!),
    });
  }
  //
  return listPostDetails;
}

/**
 * get the post details from the Hacker News page until the maxPostsToLookup is reached.
 *
 * @param {{ maxPostsToLookup: number }} [{ maxPostsToLookup }={ maxPostsToLookup: 100 }]
 * @return {Promise<PostDetailsArray>}
 */
async function getPostDetailsUntilPostRank(
  { maxPostsToLookup }: { maxPostsToLookup: number } = { maxPostsToLookup: 100 }
): Promise<PostDetailsArray> {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const postDetailsArray: PostDetailsArray = [];

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");
  await getHackerNewsPagePostsDetails(page, postDetailsArray);
  // click on the "More" button until the maxPostsToLookup is reached
  while (postDetailsArray.length <= maxPostsToLookup) {
    // click on the "More" button
    const moreButton = page.locator("a.morelink");
    await moreButton.click();
    await page.waitForTimeout(1000);
    // scrape more post details
    await getHackerNewsPagePostsDetails(page, postDetailsArray);
  }
  return postDetailsArray.filter(
    (post) => Number(post.rank) <= maxPostsToLookup
  );
}

/**
 * check if the post details array is sorted by postDate
 *
 * @param {{ postDetailsArray: PostDetailsArray }} [{ postDetailsArray }]
 * @return {boolean}
 */
const checkArrayPostDetailsSorted = ({
  postDetailsArray,
}: {
  postDetailsArray: PostDetailsArray;
}): boolean => {
  for (let i = 2; i <= postDetailsArray.length; i++) {
    const ithDetails = postDetailsArray.find(
      (postDetails) => Number(postDetails.rank) == i
    );
    const prevDetails = postDetailsArray.find(
      (postDetails) => Number(postDetails.rank) == i - 1
    );
    if (ithDetails!.postDate >= prevDetails!.postDate) {
      return false;
    }
    // else {
    //   console.log(`ithRank: ${ithDetails?.rank}`);
    //   console.log(`prevRank: ${prevDetails?.rank}`);
    //   console.log(`ithDate: ${ithDetails?.postDate}`);
    //   console.log(`prevDate: ${prevDetails?.postDate}`);
    // }
  }
  return true;
};

/**
 * verify if the Hacker News articles are sorted by postDate for the first 100 posts
 *
 * @return {Promise<void>}
 */
async function verifySortHackerNewsArticles(): Promise<void> {
  const nPostsToCheck = 100;
  console.log(`
    Task start: Verify first ${nPostsToCheck} Hacker News articles are sorted by postDate.`);
  // browse Hacker News pages and get post details for first nPostsToCheck (100)
  const postDetailsArray = await getPostDetailsUntilPostRank({
    maxPostsToLookup: nPostsToCheck,
  });
  // check if the post details array is sorted by postDate
  const isSorted = checkArrayPostDetailsSorted({ postDetailsArray });
  console.log(`
    Task complete: Verify first ${nPostsToCheck} Hacker News articles are sorted by postDate.`);
  console.log(`
    
    Hacker News articles sort check results:
    - First ${nPostsToCheck} posts are sorted by postDate: ${
    isSorted ? "YES" : "NO"
  }`);
  process.exit(0);
  // close browser
}

export { verifySortHackerNewsArticles };
