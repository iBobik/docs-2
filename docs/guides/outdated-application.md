---
title: Outdated application dialog
---

In Contember Interface, the problem of an outdated application arises when a new version of the application becomes available but the user is still using an older version. This can result in the user experiencing bugs or issues that have already been fixed in the newer version.

To solve this problem, Contember Interface has a built-in feature that displays a dialog to the user when a new version of the application is available. The dialog prompts the user to refresh the webpage to get the latest version, which ensures that they are using the most up-to-date and bug-free version of the application.

To detect when a new version is available, the application periodically fetches the `index.html` file and checks the version metadata stored in the `contember-build-version` meta tag. If the version has changed since the last time the application was loaded, the new version is considered to be available and the dialog is displayed.

:::caution
The meta tag must be included in user-land, usually using a build tool of your choice.
:::

#### Meta tag example:
```html
<meta name="contember-build-version" content="some-version-or-build-hash"/>
```


## Vite

If you're using Vite, the meta tag can be created easily using a Vite plugin.

#### vite.config.ts
```typescript
import { defineConfig, HtmlTagDescriptor, PluginOption } from 'vite'
import { createHash } from 'crypto'

const contemberBuildVersionPlugin = (): PluginOption => ({
	name: 'contember-build-version',
	transformIndexHtml: {
		order: 'post',
		handler: (html): HtmlTagDescriptor[] => {
			const fileHash = createHash('md5').update(html).digest().toString('hex')
			return [{ tag: 'meta', injectTo: 'head', attrs: { name: 'contember-build-version', content: fileHash } }]
		}
	}
})

export default defineConfig(({ command }) => ({
	// ... other options
	plugins: [contemberBuildVersionPlugin()]
}))

```
