# Building MDN Pages

The `build` command helps you rapidly build JSON and HTML boilerplates for undocumented web platform APIs.

## Before Using this Command to Generate Boilerplates:

1. Locate the spec for the platform API you want to document and have it open as you work. You can search for specs on [Specref.org](https://www.specref.org/). For many newer APIs, you find a link in its entry on [Chrome Status](https://www.chromestatus.com/features).
1. Make sure the spec is listed in the Yari repo's [SpecData.json](https://github.com/mdn/yari/blob/main/kumascript/macros/SpecData.json) file.

## Build New MDN Pages

1. In the directory where you cloned the repo type:

   `npm run build idl _someSearchString_`

   For example, if you were documenting the `Clipboard` interface you could type any of the following:

   ```bash
   npm run build idl clip
   npm run build idl board
   npm run build idl clipboard
   ```

   MDN Helper searches for interfaces containing the string you entered prompts you with a list.

   **Note:** If you know a feature is supported in Chrome, but it does not appear in this list, see [Documenting New Features](#documenting-new-features) below.

   ![Possible interfaces to build](select-an-interface.png)

1. It checks for the existence of a JSON file for the interface in the [Browser compatibility Database](https://github.com/mdn/browser-compat-data). If the file does not exist, it creates a blank JSON file.
  * The JSON file contains only false values. You will need to supply version numbers. 
  * MDN Helper writes the JSON file to a subfolder of `Desktop/out`.
1. For the interface and each of its members, MDN Helper pings the expected URL as listed in the Browser compatibility Database.

1. If pages are found to be missing for the selected interface, boilerplates will be written to the output directory using the same structure as required by "MDN/Content". If you used the interactive flag (`-i` or `--interactive`) you will be asked questions to gather information needed for the interface. This is no recommended for new MDN writers.

1. In `Desktop/out` open and inspect the files you just created. Add any additional information you feel is needed. Add code examples for every page you created whenever possible.

1. Copy the new files and directories to your local clone of the MDN Content repo. 

1. Submit pull request to MDN Content containing the files just created.

## Browser Compatibility Data

As described above, the `build` command creates browser compatibility data (BCD) files for the features you create if they're needed. BCD files contain the data used to build browser compatibility tables on MDN pages ([for example](https://developer.mozilla.org/en-US/docs/Web/API/Cache#browser_compatibility)).

Because compatibility data is required for every web platform feature, documenting new features on MDN often requires submitting to the [Browser compatibility Database](https://github.com/mdn/browser-compat-data). The `build` commmand can create just a BCD file. 

Do this with either the `-j` or `--jsonOnly` flag. For example:

`npm run build idl clipboard -- -j`

## Documenting New Features

You may find that features behind a [runtime flag](https://www.howtogeek.com/703039/how-to-enable-google-chrome-flags-to-test-beta-features/) or in an [origin trial](https://web.dev/origin-trials/) in Chrome are not surfaced in the `build` or `find` commands. MDN Helper uses Chrome as its starting point because of the ease of reading API surfaces from its source code as compared to other browsers and because Chrome is often the first browser to implement new web platform features. 

* If the feature is not yet available in another browser, it's too early to be documented on MDN. These statuses often indicate that aspects of a feature's design are still being resolved or tested and may change before the feature becomes part of the web platform. For early adoptors, resources can often be found in a feature's [spec repo](https://github.com/WICG/idle-detection). This includes the spec's explainer and sometimes MDN drafts specifically written for earlier adoptors.
  **Note:** If you're documenting a new spec that has an MDN draft, you're encouraged to use that draft as the starting place for the MDN pages. These drafts conform to MDN standards and are written by either the spec designer or implementor.

* If the feature is available in another browser, you can tell MDN Helper to ignore that it is behind a flag or in an origin trial in Chrome by using the `-f` and `-o` flags. For example:

```bash
npm run build idl clip -- -f -o
```

If the new feature is not available using this command, you can enter the name of the feature manually using the `interface` command. For example:

```bash
npm run interface -n CSSTransformValue -p length
```

This will create a property page for `CSSTransformValue.length`. For more information, see the [`interface` command](../README.md#interface) in the README.