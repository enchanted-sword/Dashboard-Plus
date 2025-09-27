# v1.8.0

## general

- fixed preference export filename not accounting for zero-based month index
- the extension is now available for firefox android!

## horizontal navigation

- added missing / in blog queue urls

## new feature! mobile quick reblog

- adds the tumblr mobile quick reblog popup menu to the mobile web interface
- mobile-only (touch controls)

# v1.7.1

## general

- rewrote the database utilities to drop an external library in favour of a faster custom implementation

## post finder

- re-implemented feature in native IDB to fix issues with large operations
- additional performance improvements

# v1.7.0

## general

- extension preferences can now be imported directly from compatible .json files
- changed extension update behaviour
- - active tumblr tabs are now only reloaded on first install
- menu theme now defaults to true blue if no theme is stored
- added filter widgets to the menu
- fixed some mutation issues that led to mutation-based features being skipped on later pages
- page world script is now run in an anonymous function in strict mode to allow for smoothly be re-initialisation on install/update
- added the dragon

## horizontal navigation

- now automatically stops/restarts when the browser window is resized below/above the 990px mobile view breakpoint
- general cleanup and improvements

## floating avatars

- fixed mutation-based issues

## link to custom theme pages

- fixed hydration bugs (stuck placeholder gradient) when adding theme page links to avatars

## show exact poll votes, show poll results without voting

- fixed mutation-based issues wrt poll features sporadically not running on new posts, especially on masonry pages

## post finder

- major performance improvements to all database operations

# v1.6.0

## better post footers

- much cleaner implementation
- now re-adds edit and delete buttons
- should also be compatible with xkit rewritten's quick reblog

## hide content in posts

- fixed blaze selector not working on new footer content

# v1.5.3

## horizontal navigation

- fixed the create post button being cut off by the right edge of the navbar

# v1.5.2

## better post footers

- improved functionality somewhat
- re-added share button for backup fix
- will probably fully replace this in the future with the Dashboard Next custom notes component if tumblr continues to cause headaches with this

# v1.5.1

## general

- corrected a minor mistake

# v1.5.0

## general

- made use of some nifty features that tumblr's "developers" still can't patch to serve as a bonus implementation of a feature 😎
- added the dragon

## new feature! better post footers

- makes post footers less ugly and fixes the button order
- `postFooterSplitNotesCount` has gotta be a new all-time low for beta feature quality. if i was getting paid to develop this garbage i would be miserable

# v1.4.4

## horizontal navigation

- fixed the create post button being cut off horizontally

## new feature! link to theme

- allows changing avatar or post header links to link to a blog's custom theme page instead of the soft navigation mobile/peepr view, where possible
- based on the legacy dashboard unfucker standalone iconfix script

# v1.4.3

## hide content in posts

- fixed follow buttons being hidden outside of posts

## content width

- fixed content width modifications being applied on masonry-styled pages

# v1.4.2

## general

- fixed a strange sporadic issue with a strict mode error being thrown

## show exact poll votes

- potentially? fixed an untracable error with polls being skipped in processing

# v1.4.1

## general

- fixed routeset watchdog not updating the routeset on some navigations, shifting the dashboard over to the left slightly
- added base compatibility for mobile-sized screens (more firefox android compatibility to come!)

## floating avatars

- fixed position not being set as sticky

# v1.4.0

## general

- unscrongled all of staff's newest attempts at """ui design"""

## new feature! square avatars

- round isn't always better, yknow?

# v1.3.3

## hide sidebar content

- fixed update/clean methods being switched

## revert activity feed popup

- fixed style bugs related to the new activity update

## activity popup filter

- updated for new activity api
- preferences for tab contents were reset, so make sure to update your preferences

# v1.3.2

## general

- added a fallback for the fallback for root node race conditions so the mutuation observer shouldn't fail to init in rare cases
- fixed the IDB upgrade routine checking `IDBObjectStore.index()` as a index deletion condition and throwing `NotFoundErrors` when attempting to upgrade

## show mutuals

- added an "uncoloured" option that inherits the default blog link text colour
- fixed mutual icons not being shown on link of the blog being reblogged from

## post finder

- replaced the slow post index arrays with much faster sets, which greatly increases cursor seek times (up to 4000 keys/second)
- added an "autosync" feature which automatically propagates updates to the live index progress/search progress counters every few seconds so they don't seem frozen during slow operations (as they normally only update once for every 100 increments)
- added better post renderer error handling so a single dubiously indexed post will no longer cause an entire page of search results to fail to display

# v1.3.1

## general

- added a fallback for noact parsing plain strings
- fixed quickInfo being registered on postStore

## post finder

- fixed searchStore not indexing quickInfo, add storedAt index
- major performance improvements, including adding a max result limit and pagination
- now shows info about indexing progress and searching progress
- results are now displayed in reverse chronological order
- search dialogue window size is now capped to prevent scrolling outside of the bounds of the window

# v1.3.0

## new feature! post finder

- indexes posts you've seen before in your browser storage and turns them into a searchable database!
- you can search multiple keywords, with the option to split keywords with either commas or spaces (replace spaces inside keywords with underscores)
- you can also filter _out_ keywords by prefixing them with a hyphen (-)
- in advanced mode, you can keep track of keywords easier with multiple search categories, and strict mode limits keyword results to only the specified categories
- still a work in progress, report bugs to the github repository or @dragongirlsnout on tumblr!

# v1.2.4

## general

- fixed an edge case where blogs changing their urls would result in a uuid clash leading to an idb ConstraintError. thanks charlotte!
- indexedResource calls are now queued, although performance increase are likely negligible

## hide in stream content

- fixed carousel titles AGAIN

## new feature! following tab as default

- always defaults your dashboard to the "following" tab.
- otherwise, tumblr will randomly switch it to "for you"

# v1.2.3

## general

- correctly implemented diff updates

## hide filtered

- added the option to filter keywords

## content wizard

- fixed justification for vertical nav layout
- fixed justification breaking long posts in the editor when in horizontal nav layout

## hide in stream content

- fixed carousels and carousel titles not being hidden

# v1.2.2

## floating avatars

- fixed left margin being widened on masonry pages
- fixed floating avatars showing up on masonry columns

## hide dashboard tabs

- fixed tag page controls being hidden

## horizontal navigation

- fixed unread posts badge border
- fixed log out button duplication

# v1.2.1

## general

- added a redundant react hydration check in the api chain
- added the dragon

## floating avatars

- fixed the user portrait showing up overtop of the bar instead of beside it
- fixed the user portrait being replaced by undefined.tumblr.com?

## show mutuals

- fixed the followed by check not checking if a blog was indexed before checking if it had a followed by status
- fixed the follow map not checking if a blog taken from react props was undefined

# v1.2.0

## general

- fixed a bunch of features' update methods to reduce visual flashing
- implemented menu themes other than true blue
- replaced evil innerHTML methods with noact to please web-ext-lint
- improved stylesheet preloading to speed up visual changes to the page
- fixed bug where the mutation manager would encounter a yet-to-be-defined root node
- fixed undefined data error when trying to store deleted blogs
- added api request queueing to reduce potential rate limiting

## new feature! customize site colors

- customizes the site's color palettes (and optionally, the menu theme)
- work in progress feature, contrast may not be properly enforced for some elements

## horizontal navigation

- fixed settings submenu icon not showing up

## show mutuals

- added blog database integration to cut down on the need for api requests

# v1.1.0

## general

- minor injection speed improvements
- made hiding tumblr advertising a default option
- added IDB integration (currently not used for much but still cool)
- added a smart class-inheritance feature that should hopefully make wrangling tumblr's horrid encoded classnames simpler

## hide-in stream content

- fixed strange video ads not being hidden

## new feature! empty inbox

- adds a button to clear your inbox
- also deletes ghost asks

## show mutuals

- no longer marks your own blog as a mutual

## activity popup filter

- added new "show notifications from" filters
- now works correctly with activityItems (replies tab)

# v1.0.1

- fixed messaging scale
- removed unimplemented feature(s)

# v1.0.0

initial release
