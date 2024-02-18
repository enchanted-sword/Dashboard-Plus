## Hide dashboard tabs
Hides the tab selector at the top of the timeline.

## Hide in-stream content
Hides specified content in the timeline.

### Options:
- **Blog recommendations:** Hides blog recommendation carousels in the timeline
- **Tag recommendations:** Hides tag recommendations in the timeline
- **Blazed content:** Hides blazed (user-sponsored) content in the timeline
- **In-stream ads:** Hides advertised content in the timeline

## Caught up carousel behaviour
Controls how the carousel element that appears at the place you last started viewing posts from appears.

### Options:

- **Display as carousel** (default)
- **Display only the text 'caught up!'**
- **Display only a dividing line**
- **Hide the element entirely**

## Timeline search
Adds a searchbar that allows searching for posts within the timeline. Posts that do not match the search query will be hidden, and the timeline will load and search the next page of posts if no matches are found or the page is scrolled further.

Searchable parameters:
- Blog names
- Post summary
- Text content within posts
- Tags
- Metadata in audio posts
- Site data for link posts
- Image descriptions

## Custom colors
Replaces the active Tumblr palette with custom user-supplied colors.

The majority of the color variables are self-explanitory, but the secondary accent and follow colors are only used in a few places.

**Secondary accent:**
- Bubble elements
- Navigation links in the sub-1190px layout's home menu account popup

**Follow:**
- Image block link attribution

## Content width
Changes the width and justification of the main content column.

### Options:

- **Content width:** Slider, from 540px to 1560px
- **Justify Content:** Slider, moves the content either to the left, center, or right of the window.

## Corner radii
Changes the corner radii of posts and other dashboard elements.

### Options:
- **Radius**: Slider, from 0px to 12px

## Ignore tumblr ad-free
Disables Tumblr's 'go ad-free' marketing and nags. Hides the ad-free menu icon and disables the popup ad that appears when Tumblr first opens in a new tab.

## Hide notification labels
Hides the labels next to blog names in notifications.

### Options:
- **Mutual labels:** Hides the 'mutuals' labels in notifications
- **Following labels:** Hides the 'following' labels in notifications
## Custom notification labels
Adds two custom notification label types: follower and potential bot.

### Options:
- **Label blogs that follow you:** Adds a blue 'following' label to users that follow you that you aren't following back
- **Label potential bots:** Adds a red 'potential bot' label to users that are likely to be bots. This feature analyzes the user's blog data and flags blogs that match one or more of several common bot profiles, but false positives are still possible, so block and/or report at your own discretion.

## Revert activity feed popup
Reverts the activity feed popup to the previous design.

## Activity popup filter
Allows filtering what types of notifications will appear in each of the activity feed popup's four tabs (activity/all, mentions, reblogs, and replies). Each of the tabs can be configured to display any combination of the following:

- rollups
- asks
- replies
- blaze notifications
- mentions
- tipping notifications
- community label notifications
- conversational notes
- follows
- gifts
- likes
- milestones
- new group blog members
- post flagged notifications
- post attribution notifications
- posting prompts
- reblogs without comments
- reblogs with comments
- reblogs with tags
- badge notifications
- 'what you missed' notifications,
- 'back in town' notifications
- spam reported notifications

### Options:
- **Default tab:** Controls which notification types will be shown in the activity/all tab
- **Mentions tab:** Controls which notification types will be shown in the mentions tab
- **Reblogs tab:** Controls which notification types will be shown in the reblogs tab
- **Replies tab:** Controls which notification types will be shown in the replies tab

## Horizontal navigation
Reverts the look of the site to its pre-July 2023 look. Changes made include:

- Moving the navigation bar back to the top of the window
- Moving the searchbar back to the navigation bar
- Blog links and the 'log out' button are put back into the account submenu
- Post, follower, activity, queue, draft, etc. counts are added back to account submenu links
- The settings icon is moved back to the account submenu
- Searchbars are re-added to blog pages

## Hide unread counts
Hides the specified unread count types.

### Options:
- **Unread posts:** Hides the unread post count on the home icon
- **Unread posts on browser tab:** Hides the unread post count on the browser tab title
- **Unread activity:** Hides the unread notification count on the activity icon
- **Unread inbox notifications:** Hides the unread message count on the inbox icon
- **Unread messages:** Hides the unread message count on the messaging icon

## Hide navigation icons
Hides the specified icons in the navbar and account submenu.

### Options:
- **Tumblr shop:** Hides all shop-related icons
- **Explore:** Hides the Explore icon
- **Domains:** Hides the Domains icon

## Hide sidebar content
Hides the specified content in the sidebar.

### Options:
- **Blog recommendations:** Hides sidebar blog recommendations
- **Empty tag following section:** Hides the nag that appears when you aren't following any tags
- **Related posts:** Hides related posts in the sidebar when viewing a post on a blog view page
- **Tumblr Radar:** Hides promoted Radar posts in the sidebar
- **Sidebar ads:** Hides advertised content in the sidebar

## Empty sidebar behaviour
Choose if or how the blog view sidebar is collapsed when empty.

### Options:
- **Never collapse** (default)
- **Collapse when empty**
- **Force collapse**

## Revert post header appearance
Reverts the post header appearance to the previous look, replacing the word 'reblogged' with the reblog icon and re-adding removed reblogged from labels.

## Floating avatars
Replaces blog avatars in post headers with the larger floating avatars in use before December 2023.

### Options:
- **Enable avatars scrolling with posts:** Enables the floating avatars sticking to the screen and scrolling down the page with the posts
- **Also show the user avatar at the top of the timeline:** Re-adds the user portrait next to the post creation buttons at the top of the timeline
- **Also convert the post editor blog avatar into a floating avatar:** Reverts the post editor's header section to its pre-February 2024 appearance with the blog avatar displayed to the left of the editor

## Hide content in posts
Hides the selected content within posts.

### Options:
- **User badges:** Hides all badges
- **Tip buttons:** Hides tip buttons
- **Blaze buttons:** Hides blaze buttons
- **Follow buttons:** Hides all follow buttons

## SafeScroll DX
Allows blurring or hiding of media and text from certain blogs or posts with certain tags.

### Options:

**Avatar filtering preference:**
- **Blur or hide all avatars** 
- **Blur or hide filtered blog avatars only**
- **Don't blur or hide avatars** (default)

**Blog filtering style:**
- **Filter posts from listed blogs:** Filters posts reblogged or posted by blogs on the filter list
- **Filter posts reblogged from listed blogs:** Filters posts reblogged from blogs on the filter list
- **filter posts where the original poster is a listed blog:** Filters posts where the root blog is on the filter list
- **Filter posts containing listed blogs in the reblog trail:** Filters posts with additions from blogs on the filter list

**Filtered blogs:** Comma-separated list of blogs to filter

**Filtered tags:** Comma-separated list of tags to filter. Prefixing tags with a hashtag is not required.

**Content filtering style:**
- **Blur** (default)
- **Cover**
- **Collapse**
- **Hide entire post**

**Show filtered content style:**
- **Hover to show content:** Temporarily removes the content filter when hovered over
- **Hover to show content, click to remove filter:** Temporarily removes the content filter when hovered over, and removes the filter entirely when clicked

**Miscellaneous options:**
- **Blur or hide media in filtered posts:** Hides images and videos in filtered posts
- **Blur or hide text in filtered posts:** Hides text in filtered posts
- **Filter posts with community labels:** Applies filters to posts with community labels

## Show exact poll votes
Displays the exact number of votes for each option in a poll.

## Show poll results without voting
Displays the relative vote percentages on polls without requiring the user to vote beforehand.

## Note finder
Adds a searchbar that allows searching for specific reblogs, replies, or likes within a post's notes.

Searchable parameters:
- Blog names
- Blogs reblogged from
- Text content of replies or reblogs
- Added tags

## Hide filtered content completely
Completely removes posts with filtered content and/or blocked blogs from the dashboard.

### Options:
**Hide posts containing:**
- **Filtered content:** Hides all posts containing filtered tags or content
- **Blocked users:** Hides posts containing blocked blogs according to the chosen blocked blog filtering style

**Blocked blog filtering:**
- **Filter posts from blocked blogs:** Filters posts reblogged or posted by blocked blocks blogs
- **Filter posts reblogged from listed blogs:** Filters posts reblogged from blocked blogs
- **filter posts where the original poster is a listed blog:** Filters posts where the root blog is blocked
- **Filter posts containing listed blogs in the reblog trail:** Filters posts with additions from blocked blogs

## Quick copy
Adds a button to post footers that allows 1-click copying of the post's short URL without site tracking data.

## Link to previous
Adds links to the previous reblog in reblogged posts.

### Options:
- **Post header link:** Re-links the previous reblogger's blog link in the post header to instead redirect to the post permalink
- **Tag link:** Adds a link to tags containing any form of 'prev tags'

## Messaging scale
Changes the scale of the messaging conversation window.

### Options:
- **Scale**: Slider, from 1x to 2x the original size

## Revert messaging window style
Reverts the messaging window appearance to its pre-July 2023 appearance

## Messaging colors
Customizes the appearance of the messaging conversation window.

### Options:
**Color style:**
- **Use theme colors:** Uses the active Tumblr palette colors (default)
- **Use blog colors:** Uses the blog colors of the other blog in the conversation
- **Use custom colors:** Uses the chosen custom colors

**Custom colors:**
- **Message color:** The message bubble color
- **Background color:** The window's background color
- **Text color:** Text and timestamp color

## Post debug info
Logs the NPF data for posts to the browser console.

## Skip mature content warning
Automatically skips the mature content warning displayed before viewing flagged blogs.