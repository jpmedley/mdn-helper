# mdn-helper
Removes repetitive work of creating MDN markup and text. Much of the work of creating a new MDN reference page is in creating  boilerplate such as headings, specification tables, and standardized intro text. Once this is created API specific content must be added to the boilerplate. A significant portion of that content is duplicated between one or more pages of the API.

This tool simplifies this process. First, it takes a command line indicating the interfaces and members to be created. It then prompts the answers to API specific content. It combines those answers with templates and writes nearly complete pages ready for pasting directly into the MDN page editor.

The current version only handles JavaScript APIs.

## Installation

1. Install [node.js](https://nodejs.org), version 10 or later.

1. Clone this repository.

   `git clone https://github.com/jpmedley/mdn-helper.git`

1. Change to the `mdn-helper` directory and run `npm install`.

1. Enter `npm run update-data` to download the IDL files needed for the `build`, `burn`, and `find` commands. You should run this command about once a week to keep your IDL files up-to-date.

## Usage

From within the mdn-helper direcory:

  `npm run <command> [<arguments>] -- [<flags>]`

## Commands

### build

Searches Chrome's IDL files for filenames matching the provided string, prompts you to select a specific file, then builds the results as though you had used the `interface` command.

**Syntax:** `build _searchString_`

### burn

Generates a burn-down list of undocumented Chrome APIs. Use -f or --flags to
include APIs behind a flag.

**Syntax:** `burn -- [(-f | --flags)]`

### clean

Deletes selected folders from the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `clean`

### css

Creates a pages for CSS selectors. The results are written to the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `css -- -n _selectorName_`

**Flag:**

`-n`: The name of the css selector being documented. This flag provides the CSS page\'s name for use in CSS pages.

### find

Searches Chrome's IDL files for filenames matching the provided string, prompts you to select a specific file, then displays the contents of that file.

**Syntax:** `find _searchString`

### header

Creates pages for the provided HTTP header and directive names names. The results are written to the `*path/to*/mdn-helper/out/` directory. To build directive plages only, exclude the -H or --header flag.

**Syntax:** <code>header -n _headerName_ [(-H | --header)] [(-d | --directive) _directiveName_]</code>

**Flags:**

`-n`: The name of the header being documented. This flag provides the header\'s name for use in directive pages. It does not create an interface page.

At least one of the following:
* `-H` or `--header`: (Optional) Indicates that a header page *should be created*. If this flag is absent only directive pages will be created.
* `-d` or `--directive`: (Optional) The name of a directive being documented. This flag may be repeated as needed.

### interface

Creates pages for JavaScript platform APIs. The results are written to the `*path/to*/mdn-helper/out/` directory.

**Syntax:** <code>interface -n _interfaceName_ [-o] [-i] [-c] [(-e | --event) _eventName_] [(-h | --handler) _handlerName_] [(-m | --method) _methodName_] [(-p | --property) _propertyName_]</code>

**Flags:**

`-n`: The name of the interface being documented. This flag provides the interface\'s name for use in member pages. It does not create an overview, interface, or constructor page.

At least one of the following:
* `-l` or `--landing`: (Optional) Indicates that a [landing page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_landing_page_template) should be created.
* `-r` or `--reference`: (Optional) Indicates that an [interface reference page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_reference_page_template) should be created.
* `-c`: (Optional) Indicates that a [constructor page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_constructor_subpage_template) should be created.
* `-it`: (Optional) Indicates that pages for the functions of the *iterable* IDL type will be created.
* `-mp`: (Optional) Indicates that pages for the functions of the *maplike* IDL type will be created.
* `-mr`: (Optional) Indicates that pages for the functions of the *readonly maplike* IDL type will be created.
* `-e` or `--event`: (Optional) Indicates that an *event* page should be created with the specified name. This flag may be repeated as needed.
* `-h` or `--handler`: (Optional) Indicates that an [event handler page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_event_handler_subpage_template) should be created with the specified name. This flag may be repeated as needed.
* `-m` or `--method`: (Optional) Indicates that a [method page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_method_subpage_template) should be created with the specified name. This flag may be repeated as needed.
* `-p` or `--property`: (Optional) Indicates that a *property* pages should be created with the specified name. This flag may be repeated as needed.

## update-data

Downloads a new set of IDL files for use by the `build`, `burn`, and `find` commands. You should run this command about once a week to keep your IDL files up-to-date.

### help

Prints help text to the console.

## Examples

**Create an interface page only**

`node index.js interface -n Widget -i`

**Create an interface page and a constructor page**

`node index.js interface -n Widget -i -c`

**Create a method page without its interface**

`node index.js interface -n Widget -m "doStuff()"`

**Create an interface page and two members**

`node index.js interface -n Widget -m "doStuff()" -p isReady`
