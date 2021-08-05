# mdn-helper
Removes repetitive work of creating MDN markup and text. Much of the work of creating a new MDN reference page is in creating boilerplate such as headings, specification tables, and standardized intro text. Once this is created API specific content must be added to the boilerplate. A significant portion of that content is duplicated between one or more pages of the API.

The current version only handles JavaScript APIs.

## Installation

1. Install [node.js](https://nodejs.org), version 12 or later.

1. Clone this repository.

   `git clone https://github.com/jpmedley/mdn-helper.git`

1. Change to the `mdn-helper` directory and run `npm install`.

1. Enter `npm run update-data` to download data files needed for the `build`, `find`, and `report` commands. This script will run automatically at startup approximately every twenty-four hours.

## Usage

From within the mdn-helper direcory:

  `npm run <command> [<arguments>] -- [<flags>]`

## Commands

### build

Searches for APIs with filenames matching the provided string, prompts you to select a specific interface, builds a JSON file for the [Browser compatibility Database](https://github.com/mdn/browser-compat-data), and boilerplate pages formatted for publishing on MDN. 

**Syntax:** `build idl _searchString_ -- [(-i | --interactive)] [(-j | --jsonOnly)]`

For detailed instructions, see [Building MDN Pages](/help/BUILDING-PAGES.md).

### report

Builds several types of reports. This has several syntaxes.

**Syntax:** `report chrome -- [(-f | --flags)] [(-i | --interfaces-only)] [(-o | --origin-trials)] [(-r | --reportinglist)]`

Generates a csv file listing Chrome APIs that are lacking an MDN page. Use `-f` or `--flags` to include APIs behind a flag. Use `-i` or `--interfaces-only` run a report containing only interfaces. Use `-o` or `--origin-trials` to include APIs currently in a Chrome origin trial. Use `-w` or `--reportinglist` report on a specific list of interfaces.

**Syntax:** `report urls -- [(-c | --category) _category_]`

Generates a csv listing BCD entries that are lacking a corresponding MDN page. `_category_` must be one of 'api', 'css', 'html', 'javascript', or 'svg'. If you don't enter one of these values, you will be prompted for one of them.

**Syntax:** `report bcd -- [(-c | --category) _category_] [(-b | --browsers) _browsers_]`

Generates a csv listing BCD entries where the browser value is either null or missing.

* `_category_` must be one of 'api', 'css', 'html', 'javascript', or 'svg'. If you don't enter one of these values, you will be prompted for one of them.
* `_browsers_` must be a comma-separated list of browsers. If you don't enter any browsers or one of the provided browser names is not valid, you will be prompted to select browsers from a list.

### clean

Deletes selected folders from the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `clean`

### find

Searches for interfaces matching the provided string, prompts you to select a specific file, then displays the Chrome IDL file for that interface. (For an explanation of why it uses Chrome, see [Data Sources](#data-sources), below.)

**Syntax:** `find idl _searchString_ -- [(-p | --ping)]`

**Flag:**

`-p` or `--ping`: (Optional) Pings the MDN pages for the interface members and
display whether they exist.

### header

Creates pages for the provided HTTP header and directive names names. The results are written to the `*path/to*/mdn-helper/out/` directory. To build directive plages only, exclude the -H or --header flag.

**Syntax:** <code>header -- -n _headerName_ [(-H | --header)] [(-d | --directive) _directiveName_]</code>

**Flags:**

`-n`: The name of the header being documented. This flag provides the header\'s name for use in directive pages. It does not create an interface page.

At least one of the following:
* `-H` or `--header`: (Optional) Indicates that a header page *should be created*. If this flag is absent only directive pages will be created.
* `-d` or `--directive`: (Optional) The name of a directive being documented. This flag may be repeated as needed.

### interface

Creates one or more individual boilerplates for JavaScript platform APIs. The results are written to the `*path/to*/mdn-helper/out/` directory. The syntax description makes this look more complicated than it is. This can be summarized as `interface -n _interfaceName_` followed by commands for one or more individual pages. For example, the following would create a boilerplate for a property:

`npm run interface -n CSSTransformValue -p length`

Note that this command cannot create multiple pages of the same time in a single command. For example, to create boilerplates for two properties, you would need to run the command twice.

**Syntax:** <code>interface -n _interfaceName_ [-l] [-r] [-c] [(-e | --event) _eventName_] [(-h | --handler) _handlerName_] [(-m | --method) _methodName_] [(-p | --property) _propertyName_] [(-w | --writefiles)</code>

**Flags:**

`-n`: The name of the interface being documented. This flag provides the interface\'s name for use in member pages. It does not create an overview, interface, or constructor page.

At least one of the following:
* `-l` or `--landing`: (Optional) Indicates that a [landing page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_landing_page_template) should be created.
* `-r` or `--reference`: (Optional) Indicates that an [interface reference page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_reference_page_template) should be created.
* `-c`: (Optional) Indicates that a [constructor page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_constructor_subpage_template) should be created.
* `-it`: (Optional) Indicates that pages for the functions of the *iterable* IDL type will be created, specifically entries(), forEach(), keys(), and values().
* `-mp`: (Optional) Indicates that pages for the functions of the *maplike* IDL type will be created.
* `-mr`: (Optional) Indicates that pages for the functions of the *readonly maplike* IDL type will be created.
* `-e` or `--event`: (Optional) Indicates that an *event* page should be created with the specified name. This flag may be repeated as needed.
* `-h` or `--handler`: (Optional) Indicates that an [event handler page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_event_handler_subpage_template) should be created with the specified name. This flag may be repeated as needed.
* `-m` or `--method`: (Optional) Indicates that a [method page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_method_subpage_template) should be created with the specified name. This flag may be repeated as needed.
* `-p` or `--property`: (Optional) Indicates that a [property page](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/Page_types/API_property_subpage_template) should be created with the specified name. This flag may be repeated as needed.
* `-` or `--writefiles`: (Optional) The pages will not be created interactively, but will be written directly to the output directory.

## update-data

Downloads a new set of IDL files for use by the `build`, `find`, and `report` commands. This command will run automatically either daily or weekly depending on the value set in your config file. Use `-s` or `--sooner` to update data sooner.

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

## configuration

When installed, no configuration is needed. [Instructions are provided](help/CONFIGURING.md) for a few options that you may want to change.

## Data Sources

MDN Helper uses Chrome as its starting point because of the ease of reading API surfaces from its source code as compared to other browsers and because Chrome is often the first browser to implement new web platform features. (If you know of an easily downloaded data set that is a reliable proxy for the features of another browser, please contact me at the email address in my GitHub profile.)

MDN Helper does not use data in web platform specs because working out which version of a spec to use as a starting point is not something that can be done algorithmically. Also, this tool was created to assist with new web platform features. For such featues, the first implementation may not include every feature described in a spec. Those unimplemented features can and do go through design changes before implementation.

If you need to document a new feature that was implemented by a browser other than Chrome, see [Documenting New Features](help/BUILDING-PAGES.md#documenting-new-features).

## Contributing

We'd love to accept your patches and contributions. See our [contributing page](CONTRIBUTING.md) for instructions on how.
