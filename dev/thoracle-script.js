const chooseMethodTabs = M.Tabs.init(document.querySelector('.tabs'), {});
const FILE_INPUT_TAB_INDEX = 0;
const URL_INPUT_TAB_INDEX = 1;

MAX_KEYWORD_COUNT = 10
const thoracleApiUrl = 'https://thoracle-link-api.herokuapp.com/ocr_parse/';
const corsApiUrl = 'https://cors-anywhere.herokuapp.com/';

async function searchPerformed() {
  const fileInputElement = document.getElementById('file-input');
  const urlInputElement = document.getElementById('url-input');
  const searchButtonElement = document.getElementById('search-button');
  const resultsElement = document.getElementById('results');
  resultsElement.innerHTML = 'Searching...';
  searchButtonElement.classList.add("disabled");

  const chosenMethodTabIndex = chooseMethodTabs.index;
  let thoracleApiRequestHeaders = {};
  let thoracleApiRequestBody = '';
  if (chosenMethodTabIndex == FILE_INPUT_TAB_INDEX) {
    const imageFile = fileInputElement.files[0];
    const formData = new FormData();
    formData.append("image", imageFile);
    thoracleApiRequestBody = formData;
  } else if (chosenMethodTabIndex == URL_INPUT_TAB_INDEX) {
    const imageUrl = urlInputElement.value;
    thoracleApiRequestBody = `image_url=${imageUrl}`;
    thoracleApiRequestHeaders = {'Content-Type': 'application/x-www-form-urlencoded'};
  }
  
  try {
    const thoracleApiResponse = await fetch(thoracleApiUrl, {
      method: 'POST',
      headers: thoracleApiRequestHeaders,
      body: thoracleApiRequestBody
    });
    const thoracleApiResponseJson = await thoracleApiResponse.json();
    const userHandle = thoracleApiResponseJson.parse[0].substring(1);
    const keywordList = thoracleApiResponseJson.parse[1];
    const keywords = keywordList.slice(0, MAX_KEYWORD_COUNT).join(' ');
    const query = `${keywords} (from:${userHandle})`;
    console.log('Built query:\n' + query);
    const encodedQuery = encodeURI(query);
    const twitterSearchUrl = `https://twitter.com/search?q=${encodedQuery}`;
    console.log('Built link:\n' + twitterSearchUrl);
  
    const twitterSearchUrlWithCors = corsApiUrl + twitterSearchUrl;
    const twitterSearchResponse = await fetch(twitterSearchUrlWithCors);
    const twitterSaearchResponseText = await twitterSearchResponse.text();
    const tweetId = /data-tweet-id="([0-9]+)"/.exec(twitterSaearchResponseText)[1];
    const tweetLink = `https://twitter.com/${userHandle}/status/${tweetId}`
  
    let resultHtml = 'Found the Twitter link:<br>';
    resultHtml += `<a href="${tweetLink}" target="_blank">${tweetLink}</a><br/>`;
    resultsElement.innerHTML = resultHtml;
  } catch (exception) {
    console.log(exception)
    resultsElement.innerHTML = 'Tweet could not be found.';
  } finally {
    searchButtonElement.classList.remove("disabled");
  }
  
}
