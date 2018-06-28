# mdn-helper
Removes repetitive work of creating MDN boilerplate markup and text.

## Installation

1. Clone this repository.

   `git clone https://github.com/jpmedley/mdn-helper.git`

1. (Optional) Add an alias for it to your .bashrc file. For example:

   `alias mdn-helper='node *path/to*/mdn-helper/index.js'`

## Usage

  `node index.js [command] [arguments]`

## Commands

### create

Creates MDN pages based on the submitted flags and arguments.

**Syntax:** `create [-i interface] [-c] [-o] [-a[memberName pageType]]`

**Flags:**

* `-i`: The name of the parent interface for the pages you are creating.
* `-c`: Indicates that a *constructor* page should be created.
* `-o`: Indicates that an *overview* page should be created.
* `-a`: Indicates the name and page type of an interface member. The arguments to this flag may be repeated as many times as needed.

### clean

Empties the `out/` directory.

### help

Prints help text to the console.
