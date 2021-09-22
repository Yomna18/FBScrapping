//Imports
const puppeteer = require("puppeteer");
// const dotenv = require("dotenv");
const fs = require("fs");
// dotenv.config();

//GLOBAL VARIABLES
const WAIT_FOR_PAGE = 1000;
const DELAY_INPUT = 1;

//Main Function
(async () => {
  try {
    //starting Chrome
    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: false
    });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.facebook.com" , ["notifications"]);

    //Opening the Facebook Login
    const page = await browser.newPage({ viewport: null });
    await page.goto("https://www.facebook.com");
    await delay(WAIT_FOR_PAGE);

    //logging in
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', "01090023898", {
      delay: DELAY_INPUT
    });
    await page.type('input[name="pass"]', "18111999", {
      delay: DELAY_INPUT
    });
    await Promise.all([
      await page.click('button[data-testid="royal_login_button"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);
    //await page.click('button[data-testid="royal_login_button"]');
    //await delay(5*WAIT_FOR_PAGE);

    //Opening the Facebook Group
    await page.goto("https://www.facebook.com/groups/arabfoodworld");
    await delay(WAIT_FOR_PAGE);

    //scraping function
    const posts = await page.evaluate(async () => {
      let posts = [];
      var postcounter = 0;
      let NUMBER_OF_POSTS = 3;
      //Scraping Data Function
      window.scrollBy(0, window.innerHeight * 10);
      function delay(time) {
        return new Promise(function(resolve) {
          setTimeout(resolve, time);
        });
      }
      await delay(1000);

      async function scrapData() {
        try {
          window.scrollBy(0, window.innerHeight * 10);
          function delay(time) {
            return new Promise(function(resolve) {
              setTimeout(resolve, time);
            });
          }
          await delay(2000);
          // Detecting the number of the posts loaded on the browser
          const postListLength = document.querySelectorAll(
            'div[data-ad-preview="message"]'
          ).length;
          console.log("postListLength ", postListLength);
          class Post {
            constructor(document) {
              console.log("post initiallized");
              this.document = document;
              this.postContainer = document.querySelector(
                "div.du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0"
              );
              this.postdata = document.querySelector(
                'div[data-ad-preview="message"]'
              ); //getting post
              this.postLikes = this.postContainer.querySelector(
                "span.gpro0wi8.pcp91wgn"
              );
              this.postFooter = this.postContainer.querySelector(
                "div.l9j0dhe7 > div > div.bp9cbjyn.j83agx80.pfnyh3mw.p1ueia1e"
              );
              this.postAuthor = this.postContainer.querySelector("strong");
              this.postAuthorVerified = this.postContainer.querySelector(
                'div[aria-label="Verified"]'
              );
              this.postTimestamp = this.postContainer.querySelector(
                "span.tojvnm2t.a6sixzi8.abs2jz4q.a8s20v7p.t1p8iaqh.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.iyyx5f41"
              );
             
            }
            getpostfeatures() {
              try {
                let data = {};
                let strFooter = this.postFooter.innerText.trim();
                let postComments = strFooter.substring(
                  0,
                  strFooter.indexOf("comments")
                );
                let postShares = strFooter.substring(
                  strFooter.lastIndexOf("ts") + 2,
                  strFooter.lastIndexOf("shares")
                );

                let isVerified;

                if (this.postAuthorVerified) {
                  isVerified = true;
                } else {
                  isVerified = false;
                }

                var today = new Date();
                var year = today.getFullYear();
                var month = today.getMonth() + 1;
                var day = today.getDate();
                var hour = today.getHours();
                var minute = today.getMinutes();
                var second = today.getSeconds();
                var date = year + "-" + month + "-" + day;
                var time = hour + ":" + minute + ":" + second;
                var dateTime = date + " " + time;
                console.log(this.postTimestamp);
                console.log(this.postTimestamp.innerText.trim());

                return new Promise(resolve => {
                  //gettin the features we are intrested in from the post
                  setTimeout(() => {
                    if (this.postdata.querySelector("span") === null) {
                      return resolve("");
                    } else {
                      data["post"] = this.postdata
                        .querySelector("span")
                        .innerText.trim();
                      data["likes"] = this.postLikes.innerText.trim();
                      data["comments"] = postComments;
                      data["shares"] = postShares;
                      data["author"] = this.postAuthor.innerText.trim();
                      data["isVerified"] = isVerified;
                      //date["timestamp"] = this.postTimestamp.innerText.trim();
                      data["now-date"] = dateTime;

                      dateTime = "";

                      return resolve(data);
                    }
                  }, 0);
                });
              } catch (error) {
                console.log("scrap post error ===> ", error);
              }
            }
            //to remove the post
            removepost() {
              this.postdata.remove();
              this.postContainer.remove();
              this.postLikes.remove();
              this.postFooter.remove();
              this.postAuthor.remove();
              if (this.postAuthorVerified) this.postAuthorVerified.remove();
              this.postTimestamp.remove();
            }
          } //end of post class

          const post = new Post(document);
          if (post.postdata) {
            postcounter++;
            let mydata = await post.getpostfeatures();
            if (postcounter === 1) {
              mydata["shares"] = mydata["shares"].split("\n")[1];
            }
            posts.push({
              post_id: postcounter,
              post: mydata["post"],
              likes: mydata["likes"],
              comments: mydata["comments"],
              shares: mydata["shares"],
              author: mydata["author"],
              isVerified: mydata["isVerified"],
              timestamp: mydata["timestamp"],
              dateNow: mydata["now-date"]
            });
            console.log(mydata);
            post.removepost();
            if (posts.length < NUMBER_OF_POSTS) await scrapData();
            else {
              return {
                posts: posts
              };
            }
          } else {
            console.log("postList if no post found ==> ", posts);
            return {
              posts: posts
            };
          }
        } catch (error) {
          console.error("error from scrapDataFunction ==>", error);
          debugger;
        }
      }

      await scrapData();
      return {
        posts: posts
      };
    });
    //storing the posts we scraped in a json file
    storeDataInJSON("./Testing.json", posts["posts"]);

    //closing the browser
    //await browser.close();
  } catch (error) {
    console.log("Catched error message", error.message);
    console.log("Catched error stack", error.stack);
    console.log("Catched error ", error);
  }
})();

//Storig data into json file
const storeDataInJSON = async function(file, data) {
  console.log(data);
  return fs.writeFileSync(file, JSON.stringify(data), err => {
    if (err) {
      return err;
    }
    return;
  });
};

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}
