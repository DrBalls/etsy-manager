import staticContentsEtsyEnhancer from "url:../../static/contents/etsy-enhancer"
chrome.scripting.registerContentScripts([
  {"id":"staticContentsEtsyEnhancer","js":[staticContentsEtsyEnhancer.split("/").pop().split("?")[0]],"matches":["https://www.etsy.com/*"],"world":"MAIN"}
]).catch(_ => {})
