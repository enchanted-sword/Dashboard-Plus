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
