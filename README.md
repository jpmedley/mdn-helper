# mdn-helper
Removes repetitive work of creating MDN markup and text. Much of the work of creating a new MDN reference page is in creating  boilerplate such as headings, specification tables, and standardized intro text. Once this is created API specific content must be added to the boilerplate. A significant portion of that content is duplicated between one or more pages of the API.

This tool simplifies this process. First, it takes a command line indicating the interfaces and members to be created. It then prompts the answers to API specific content. It combines those answers with templates and writes nearly complete pages ready for pasting directly into the MDN page editor.

The current version only handles JavaScript APIs.

## Installation

1. Clone this repository.

   `git clone https://github.com/jpmedley/mdn-helper.git`

1. (Optional) Add an alias for it to your .bashrc file. For example:

   `alias mdn-helper='node *path/to*/mdn-helper/index.js'`

## Usage

From within the mdn-helper direcory:

  `node index.js <command> [<arguments>]`
  
Using the optional bash alias:

  `mdn-helper <command> [<arguments>]`

## Commands

### create

Creates MDN pages based on the submitted flags and arguments. The results are written to the `*path/to*/mdn-helper/out` directory.

**Syntax:** `create [-i interface] [-c] [-o] [-a memberName1 pageType [[memberName2 pageType] ... [memberNameN pageType]]] [-it]`

**Flags:**

* `-i`: The name of the parent interface for the pages you are creating. This flag does not create an interface.
* `-p`: Indicates that an *interface* page should be created.
* `-c`: Indicates that a *constructor* page should be created.
* `-o`: Indicates that an *overview* page should be created.
* `-a`: Indicates the name and page type of an interface member. The arguments to this flag may be repeated as many times as needed.
* `-it`: Indicates that the interface implements [`iterable`](https://heycam.github.io/webidl/#idl-iterable). This means pages will be created for methods named `entries()`, `forEach()`, `keys()`, and `values()`. Since these pages use standard descriptions, you will not be prompted to provide them.

**Supported page types**

The following `pageTypes` are supported by the `-a` argument.

* event
* handler
* method
* onevent
* property

### clean

Empties the `/out` directory.

### help

Prints help text to the console.

## Examples

**Create an interface page only**

`node index.js create -i Widget -p`

**Create an interface page and a constructor page**

`node index.js create -i Widget -p -c`

**Create a method page without its interface**

`node index.js create -i Widget -a "make()" method`

**Create an interface page and two members**

`node index.js create -i Widget -p -a "make()" method ready property`

**Create iterable pages**

The following command creates pages for methods named `entries()`, `forEach()`, `keys()`, and `values()`, but not an overview page.

`node index.js create -i Widget -it`
