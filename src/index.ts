// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

import { verifySortHackerNewsArticles } from "./modules/test_hacker_news_site";
import { addTimestampToConsoleLog } from "./utils/modifyConsoleLog";

(async () => {
  addTimestampToConsoleLog();
  await verifySortHackerNewsArticles();
})();
