const chooseMethodTabs = M.Tabs.init(document.querySelector('.tabs'), {});
const FILE_INPUT_TAB_INDEX = 0;
const URL_INPUT_TAB_INDEX = 1;

const thoracleApiUrl = 'https://thoracle-link-api.herokuapp.com/run';
const corsApiUrl = 'https://cors-anywhere.herokuapp.com/';

async function serverSideCrawl(thoracleApiRequestBody) {
  thoracleApiRequestBody.append('requested_results', 'search');
  const thoracleApiResponse = await fetch(thoracleApiUrl, {
    method: 'POST',
    body: thoracleApiRequestBody
  });
  const thoracleApiResponseJson = await thoracleApiResponse.json();
  const tweetLink = thoracleApiResponseJson.search;
  return tweetLink;
}

async function clientSideCrawl(thoracleApiRequestBody) {
  thoracleApiRequestBody.append('requested_results', 'parse,query');
  const thoracleApiResponse = await fetch(thoracleApiUrl, {
    method: 'POST',
    body: thoracleApiRequestBody
  });
  const thoracleApiResponseJson = await thoracleApiResponse.json();
  const userHandle = thoracleApiResponseJson.parse[0].substring(1);
  const twitterSearchUrl = thoracleApiResponseJson.query[1];

  const twitterSearchUrlWithCors = corsApiUrl + twitterSearchUrl;
  const twitterSearchResponse = await fetch(twitterSearchUrlWithCors, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko.'
    }
  });
  const twitterSaearchResponseText = await twitterSearchResponse.text();
  const tweetId = /data-tweet-id="([0-9]+)"/.exec(twitterSaearchResponseText)[1];
  const tweetLink = `https://twitter.com/${userHandle}/status/${tweetId}`
  return tweetLink;
}

async function searchPerformed() {
  const fileInputElement = document.getElementById('file-input');
  const urlInputElement = document.getElementById('url-input');
  const serverSideCrawlElement = document.getElementById('server-side-crawl');
  const searchButtonElement = document.getElementById('search-button');
  const resultsElement = document.getElementById('results');
  resultsElement.innerHTML = 'Searching...';
  searchButtonElement.classList.add('disabled');

  const chosenMethodTabIndex = chooseMethodTabs.index;
  const thoracleApiRequestBody = new FormData();
  if (chosenMethodTabIndex == FILE_INPUT_TAB_INDEX) {
    const imageFile = fileInputElement.files[0];
    thoracleApiRequestBody.append('image', imageFile);
  } else if (chosenMethodTabIndex == URL_INPUT_TAB_INDEX) {
    const imageUrl = urlInputElement.value;
    thoracleApiRequestBody.append('image_url', imageUrl);
  }
  
  try {
    let tweetLink = null;
    if (serverSideCrawlElement.checked) {
      tweetLink = await serverSideCrawl(thoracleApiRequestBody);
    } else {
      tweetLink = await clientSideCrawl(thoracleApiRequestBody);
    }
    
    if (!tweetLink) {
      throw 'Not found';
    }

    let resultHtml = 'Found the Twitter link:<br>';
    resultHtml += `<a href="${tweetLink}" target="_blank">${tweetLink}</a><br/>`;
    resultsElement.innerHTML = resultHtml;
  } catch (exception) {
    console.log(exception)
    resultsElement.innerHTML = 'Tweet could not be found.';
  } finally {
    searchButtonElement.classList.remove('disabled');
  }
  
}
