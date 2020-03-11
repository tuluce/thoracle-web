const chooseMethodTabs = M.Tabs.init(document.querySelector('.tabs'), {});
const FILE_INPUT_TAB_INDEX = 0;
const URL_INPUT_TAB_INDEX = 1;

var imageFile;
var imageUrl;
var tweetUrl;

async function sendRequest() {
  const storage = firebase.storage();
  const testsRef = storage.refFromURL('gs://thoracle-dev.appspot.com/tests.json')
  const testsDownloadUrl = await testsRef.getDownloadURL();
  const tests  = await (await fetch(testsDownloadUrl)).json();
  const lastTest = tests[tests.length - 1];
  let nextTestId = "TW-0000";
  if (lastTest.id) {
    const lastTestIdNo = parseInt(/TW-([0-9]+)/.exec(lastTest.id)[1]);
    const nextTestIdNo = lastTestIdNo + 1;
    const nextTestIdNoPadded = ('0000' + nextTestIdNo).substr(-4);
    nextTestId = `TW-${nextTestIdNoPadded}`;
  }
  if (imageFile) {
    const fileName = ("" + new Date()).substring(4, 24);
    const fileExtension = imageFile.name.split('.').pop();
    const imageFileGsUrl = `gs://thoracle-dev.appspot.com/screenshots/${fileName}.${fileExtension}`;
    const imageRef = storage.refFromURL(imageFileGsUrl);
    await imageRef.put(imageFile);
    imageUrl = await imageRef.getDownloadURL();
  }
  tests.push({
    id: nextTestId,
    imageUrl: imageUrl,
    tweetUrl: tweetUrl
  });
  await testsRef.putString(JSON.stringify(tests, null, 2));
  return `Added test case: ${nextTestId}`;
}

async function submitTestCase() {
  const fileInputElement = document.getElementById('file-input');
  const imageUrlInputElement = document.getElementById('image-url-input');
  const tweetUrlInputElement = document.getElementById('tweet-url-input');
  const submitButtonElement = document.getElementById('submit-button');
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = 'Uploading...';
  submitButtonElement.classList.add('disabled');

  tweetUrl = tweetUrlInputElement.value;
  const chosenMethodTabIndex = chooseMethodTabs.index;
  if (chosenMethodTabIndex == FILE_INPUT_TAB_INDEX) {
    imageFile = fileInputElement.files[0];
    imageUrl = null;
    if (!imageFile) {
      displayResult('Please select an image');
      return;
    }
  } else if (chosenMethodTabIndex == URL_INPUT_TAB_INDEX) {
    imageFile = null;
    imageUrl = imageUrlInputElement.value;
    if (!isValidURL(imageUrl)) {
      displayResult('Please enter a valid image URL');
      return;
    }
  }
  if (!isValidURL(tweetUrl)) {
    displayResult('Please enter a valid tweet URL');
    return;
  }
  
  try {
    const result = await sendRequest();
    resultElement.innerHTML = result;
  } catch (exception) {
    console.log(exception)
    resultElement.innerHTML = 'An error occured.';
  } finally {
    submitButtonElement.classList.remove('disabled');
  }
  
}

function displayResult(result) {
  const resultElement = document.getElementById('result');
  const submitButtonElement = document.getElementById('submit-button');
  resultElement.innerHTML = result;
  submitButtonElement.classList.remove('disabled');
}

function isValidURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}
